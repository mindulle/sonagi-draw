import os
import shutil
import sqlite3
import time
import json
import uuid
import httpx
import boto3
from botocore.client import Config
from typing import List, Optional, Dict, Any
from mcp.server.fastmcp import FastMCP

# FastMCP 초기화
mcp = FastMCP("sonagi-draw-mcp")

# Tldraw DB 경로 (llmops 로컬 미러).
# CEO-933: 이 로컬 미러는 실제 프로덕션 sync-server와 동기화되지 않는 것으로 확인됨
# (Syncthing이 이 경로를 관리하지 않음 - get_room_state 수정 시 검증됨). 따라서 이 경로는
# 이제 오직 (1) init_db의 템플릿 파일 복사/room DB 존재 여부 체크, (2) set_template_room/
# list_templates/delete_room/cleanup_all_test_rooms 같은 순수 파일 단위 작업에만 쓰입니다.
# 방/캔버스의 실제 도형(shape)을 만들거나 조회하는 모든 도구(create_room, add_sticky_note,
# add_wireframe_box, generate_moodboard_layout, get_room_state, push_to_inbox,
# get_page_shapes_live)는 SQLite를 전혀 건드리지 않고 bridge/canvas_bridge.mjs
# (Playwright + 실제 window.editor API)를 통해 안전하게 기록/조회합니다.
DB_DIR = "/home/ubuntu/sonagi-draw-prod/.rooms"
TEMPLATE_DIR = "/home/ubuntu/sonagi-draw-prod/.templates"
DRAWINGS_DIR = "/home/ubuntu/llm-wiki/03_Resources/Drawings"

# canvas_bridge.mjs 위치 및 배포된 화이트보드 URL (Nginx 프록시 경유)
BRIDGE_SCRIPT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "bridge", "canvas_bridge.mjs")
DRAW_BASE_URL = os.environ.get("DRAW_BASE_URL", "http://127.0.0.1:3550/draw")

# MinIO (CDN) 클라이언트 설정
s3_client = boto3.client(
    's3',
    endpoint_url='https://cdn.sonagi.space',
    aws_access_key_id='admin',
    aws_secret_access_key='anki123456',
    config=Config(signature_version='s3v4')
)

def upload_image_to_cdn(image_url: str) -> str:
    """외부 이미지를 다운로드하여 Sonagi MinIO CDN에 업로드 후 영구 URL 반환"""
    try:
        resp = httpx.get(image_url, follow_redirects=True, timeout=10.0)
        resp.raise_for_status()
        img_data = resp.content
        content_type = resp.headers.get("content-type", "image/jpeg")
        
        ext = "jpg"
        if "png" in content_type: ext = "png"
        elif "webp" in content_type: ext = "webp"
        elif "gif" in content_type: ext = "gif"
        
        filename = f"tldraw_assets/asset_{uuid.uuid4().hex[:10]}.{ext}"
        s3_client.put_object(
            Bucket='assets',
            Key=filename,
            Body=img_data,
            ContentType=content_type
        )
        return f"https://cdn.sonagi.space/assets/{filename}"
    except Exception as e:
        print(f"[CDN Upload Error] {image_url} -> {e}")
        return image_url

def drawing_exists(identifier: str) -> bool:
    clean = identifier.replace(".tldr", "").replace(".db", "").strip()
    tldr_path = os.path.join(DRAWINGS_DIR, f"{clean}.tldr")
    if os.path.exists(tldr_path):
        return True
    db_path = os.path.join(DB_DIR, f"{clean}.db")
    return os.path.exists(db_path)

def get_db_path(room_id: str) -> str:
    return os.path.join(DB_DIR, f"{room_id}.db")


def _run_bridge_or_none(args: Dict[str, Any]) -> Optional[str]:
    """_run_bridge를 호출하되 오류 문자열("❌...")이면 그대로 반환하고, 성공하면 None을 반환합니다.
    '오류가 있으면 즉시 반환, 없으면 계속 진행'하는 형태의 얕은 가드로 각 도구에서 재사용합니다."""
    result = _run_bridge(args)
    return result if result.startswith("❌") else None

def init_db(db_path: str, template_name: str = "default"):
    # 지정된 템플릿 DB 복사하여 초기화
    template_path = os.path.join(TEMPLATE_DIR, f"{template_name}.db")
    if not os.path.exists(template_path):
        # 기본 템플릿이 없을 경우 Fallback (예전 하드코딩 호환성)
        template_path = os.path.join(TEMPLATE_DIR, "default.db")
        if not os.path.exists(template_path):
            template_path = os.path.join(DB_DIR, "6839ol97.db")
        
    shutil.copyfile(template_path, db_path)
    
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    # 기존 유저 세션 정보만 공통으로 삭제
    c.execute("DELETE FROM documents WHERE id LIKE 'user:%'")
    
    # default 템플릿을 생성할 때만 기존 shape 등을 밀고 3-Tab을 세팅
    if template_name == "default":
        c.execute("DELETE FROM documents WHERE id LIKE 'shape:%' OR id LIKE 'asset:%' OR id LIKE 'page:%'")
        
        # 멀티 페이지(3-Tabs) 주입
        ts = int(time.time() * 1000)
        pages = [
            ("page:page", json.dumps({"meta":{},"id":"page:page","name":"🎨 Moodboard","index":"a1","typeName":"page"}).encode('utf-8'), ts),
            ("page:wireframe", json.dumps({"meta":{},"id":"page:wireframe","name":"📐 Wireframe & UI Kit","index":"a2","typeName":"page"}).encode('utf-8'), ts),
            ("page:journey", json.dumps({"meta":{},"id":"page:journey","name":"🗺️ User Journey","index":"a3","typeName":"page"}).encode('utf-8'), ts)
        ]
        c.executemany("INSERT INTO documents (id, state, lastChangedClock) VALUES (?, ?, ?)", pages)
        
    conn.commit()
    conn.close()

@mcp.tool()
def create_room(title: str, issue_id: Optional[str] = None, template_name: str = "default") -> str:
    """
    신규 tldraw 도면(.tldr)을 생성하고 3개의 멀티 페이지(Moodboard, Wireframe, User Journey)를 기본 세팅합니다.
    template_name을 지정하여 특정 템플릿 기반으로 생성할 수 있습니다.
    """
    safe_title = "".join(c for c in title if c.isalnum() or c in "-_ ").strip().replace(" ", "_")
    if not safe_title:
        safe_title = f"Drawing_{uuid.uuid4().hex[:8]}"

    # 1. 파일 기반 저장소(llm-wiki)에 신규 .tldr 도면 생성
    try:
        httpx.post("http://127.0.0.1:3550/api/drawings/new", json={"name": safe_title}, timeout=5.0)
    except Exception as e:
        print(f"[create_room] drawings API warning: {e}")

    # 2. 하위 호환성을 위해 로컬 DB 템플릿도 복사
    os.makedirs(DB_DIR, exist_ok=True)
    db_path = get_db_path(safe_title)
    init_db(db_path, template_name)

    room_url = f"https://activity.sonagi.space/draw/?file={safe_title}"

    if template_name == "default":
        args = {
            "action": "create_room_content",
            "baseUrl": DRAW_BASE_URL,
            "file": safe_title,
            "title": title,
            "issueId": issue_id,
        }
        error = _run_bridge_or_none(args)
        if error:
            return f"⚠️ 도면은 생성되었으나 초기 콘텐츠 주입 중 오류가 발생했습니다: {error}\n도면 URL: {room_url}"

    return f"✅ 도면 생성 완료: {room_url}"

@mcp.tool()
def generate_moodboard_layout(room_id: str, image_urls: List[str], palette_hex: List[str], rules: str) -> str:
    """
    [Phase 1] 이미지 배열, 컬러 팔레트, 텍스트 규칙을 tldraw 캔버스에 시각적으로 정렬하여 렌더링합니다.
    """
    if not drawing_exists(room_id):
        return f"❌ 오류: Room ID '{room_id}'가 존재하지 않습니다."

    start_x, start_y = 100, 200
    gap = 20
    img_w, img_h = 300, 300
    images = []
    for i, url in enumerate(image_urls):
        col = i % 2
        row = i // 2
        x = start_x + col * (img_w + gap)
        y = start_y + row * (img_h + gap)
        cdn_url = upload_image_to_cdn(url)
        images.append({
            "assetId": f"asset:{uuid.uuid4()}",
            "cdnUrl": cdn_url,
            "x": x, "y": y, "w": img_w, "h": img_h,
        })

    args = {
        "action": "generate_moodboard_layout",
        "baseUrl": DRAW_BASE_URL,
        "file": room_id,
        "pageId": "page:page",
        "rules": rules,
        "paletteHex": palette_hex,
        "images": images,
    }
    error = _run_bridge_or_none(args)
    if error:
        return error

    return f"✅ 무드보드 레이아웃 완료 (Images: {len(image_urls)}, Palette: {len(palette_hex)})"

@mcp.tool()
def add_sticky_note(room_id: str, text: str, x: float = 100, y: float = 100, color: str = "yellow", page_id: str = "page:page") -> str:
    """
    [Phase 3] 캔버스 특정 위치에 피드백이나 코멘트를 남길 수 있는 포스트잇(Sticky Note)을 붙입니다.
    color는 tldraw 지원 색상(yellow, blue, green, red, black, white 등) 중 하나여야 합니다.
    """
    if not drawing_exists(room_id):
        return f"❌ 오류: Room ID '{room_id}'가 존재하지 않습니다."

    args = {
        "action": "add_sticky_note",
        "baseUrl": DRAW_BASE_URL,
        "file": room_id,
        "pageId": page_id,
        "text": text,
        "x": x,
        "y": y,
        "color": color,
    }
    return _run_bridge(args)

@mcp.tool()
def add_wireframe_box(room_id: str, x: float, y: float, w: float, h: float, text: str = "", page_id: str = "page:page") -> str:
    """
    캔버스의 특정 페이지에 기본적인 와이어프레임 박스(회색 윤곽선)를 그립니다. (UI/UX 뼈대 잡기용)
    선택적으로 박스 중앙에 들어갈 텍스트(예: "네비게이션", "메인 버튼")를 지정할 수 있습니다.
    """
    if w <= 0 or h <= 0:
        return "❌ 오류: 와이어프레임 박스의 너비(w)와 높이(h)는 0보다 커야 합니다."

    if not drawing_exists(room_id):
        return f"❌ 오류: Room ID '{room_id}'가 존재하지 않습니다."

    args = {
        "action": "add_wireframe_box",
        "baseUrl": DRAW_BASE_URL,
        "file": room_id,
        "pageId": page_id,
        "x": x,
        "y": y,
        "w": w,
        "h": h,
        "text": text,
    }
    return _run_bridge(args)

@mcp.tool()
def get_room_state(room_id: str, page_id: Optional[str] = None) -> Dict[str, Any]:
    """
    [Phase 3] 현재 캔버스 상태(Shape) 목록 반환 (Make Real 연동용)
    page_id(예: 'page:wireframe')를 지정하면 해당 페이지의 도형만 반환합니다.

    CEO-933: 예전에는 이 툴이 Python MCP 서버의 로컬 SQLite 미러(DB_DIR)를 직접 읽었음.
    그런데 이 로컬 미러는 실제 프로덕션(devops의 sync-server)과 동기화되는 메커니즘이
    없는 것으로 확인됨(Syncthing이 이 경로를 전혀 관리하지 않음) - 즉 add_shape_to_db로
    직접 SQL을 쓴 내용은 로컬 미러에는 보이지만 실제 라이브 룸에는 절대 반영되지 않는데도
    이 툴은 그걸 정상인 것처럼 보고하고 있었음. 이제 canvas_bridge.mjs를 통해 실제
    window.editor의 라이브 상태를 직접 읽도록 변경 (get_page_shapes_live와 동일한 원리).
    """
    args = {
        "action": "get_room_state",
        "baseUrl": DRAW_BASE_URL,
        "roomId": room_id,
        "file": room_id,
        "pageId": page_id,
    }
    result_json = _run_bridge(args)
    try:
        result = json.loads(result_json)
    except json.JSONDecodeError:
        return {"error": f"bridge 응답을 파싱할 수 없습니다: {result_json}"}

    if not result.get("ok"):
        return {"error": result.get("error", "unknown error"), "details": result}

    return {
        "room_id": room_id,
        "page_id": page_id or "all",
        "available_pages": result.get("available_pages", []),
        "total_shapes": result.get("total_shapes", 0),
        "shapes": result.get("shapes", []),
    }

@mcp.tool()
def set_template_room(room_id: str, template_name: str) -> str:
    """
    특정 방의 현재 상태를 새로운 템플릿으로 저장합니다.
    이후 create_room 호출 시 이 template_name을 사용하여 방을 생성할 수 있습니다.
    """
    db_path = get_db_path(room_id)
    if not os.path.exists(db_path):
        return f"❌ 오류: Room ID '{room_id}'가 존재하지 않습니다."
        
    os.makedirs(TEMPLATE_DIR, exist_ok=True)
    template_path = os.path.join(TEMPLATE_DIR, f"{template_name}.db")
    shutil.copyfile(db_path, template_path)
    
    return f"✅ 템플릿 저장 완료: Room '{room_id}'가 '{template_name}' 템플릿으로 저장되었습니다."

@mcp.tool()
def list_templates() -> List[str]:
    """
    사용 가능한 모든 템플릿 목록을 반환합니다.
    """
    if not os.path.exists(TEMPLATE_DIR):
        return []
    
    templates = []
    for file_name in os.listdir(TEMPLATE_DIR):
        if file_name.endswith(".db"):
            templates.append(file_name.replace(".db", ""))
    return templates

@mcp.tool()
def delete_room(room_id: str) -> str:
    """
    특정 tldraw 방(SQLite DB)을 삭제합니다.
    """
    if room_id == "6839ol97":
        return "❌ 오류: 템플릿 DB(6839ol97)는 기본 스키마 원본이므로 삭제할 수 없습니다."
        
    db_path = get_db_path(room_id)
    if os.path.exists(db_path):
        os.remove(db_path)
        return f"✅ 방 삭제 완료: Room ID '{room_id}'"
    return f"❌ 오류: Room ID '{room_id}'가 존재하지 않습니다."

@mcp.tool()
def cleanup_all_test_rooms() -> str:
    """
    템플릿 DB를 제외한 모든 tldraw 방을 일괄 삭제하여 디렉토리를 정리합니다.
    """
    if not os.path.exists(DB_DIR):
        return "정리할 방이 없습니다."
        
    count = 0
    for file_name in os.listdir(DB_DIR):
        if file_name.endswith(".db") and file_name != "6839ol97.db":
            os.remove(os.path.join(DB_DIR, file_name))
            count += 1
            
    return f"✅ 방 일괄 정리 완료: 총 {count}개의 테스트 방이 삭제되었습니다."

@mcp.tool()
def push_to_inbox(room_id: str, title: Optional[str] = None, items: Optional[List[Dict[str, Any]]] = None,
                   page_name: Optional[str] = None) -> str:
    """
    에이전트가 캔버스에 직접 SQL이나 REST API를 건드리지 않고, 실제 브라우저 자동화(Playwright)로
    Tldraw의 공식 Editor API(window.editor)를 호출하여 <WiredMcpInboxShape> 컴포넌트에
    데이터(텍스트, 레퍼런스 이미지 등)를 안전하게 push하는 도구입니다.

    해당 페이지에 이미 인박스가 있으면 내용을 이어붙이고(merge), 없으면 새로 생성합니다.
    - items 예시: [{"text": "설명"}, {"imageUrl": "https://..."}]
    - page_name을 지정하지 않으면 마지막으로 열려있던 페이지를 사용합니다.
    """
    items = items or []
    args = {
        "action": "push_to_inbox",
        "baseUrl": DRAW_BASE_URL,
        "roomId": room_id,
        "file": room_id,
        "pageName": page_name,
        "title": title,
        "items": items,
    }
    return _run_bridge(args)


@mcp.tool()
def get_page_shapes_live(room_id: str, page_name: Optional[str] = None) -> Dict[str, Any]:
    """
    [실시간 조회] SQLite 파일이 아니라 실제 브라우저(Playwright)로 접속하여
    현재 페이지에 렌더링되어 있는 도형 목록(id, type, x, y)을 그대로 가져옵니다.
    get_room_state()보다 느리지만, Syncthing 동기화 지연 없이 지금 이 순간의 실제 상태를 봅니다.
    """
    args = {
        "action": "get_page_shapes",
        "baseUrl": DRAW_BASE_URL,
        "roomId": room_id,
        "file": room_id,
        "pageName": page_name,
    }
    result = json.loads(_run_bridge(args))
    return result


@mcp.tool()
def get_client_debug_logs(limit: int = 50, level: Optional[str] = None, file_or_room: Optional[str] = None) -> str:
    """
    [CEO-1151 / DRAW-7] 로컬 클라이언트(Obsidian, Web, Discord Activity)의 실시간 DevTools 콘솔 및 비동기 에러 로그를 조회합니다.
    level: 'error', 'warn', 'info' 또는 None(전체).
    """
    try:
        params: Dict[str, Any] = {"limit": limit}
        if level:
            params["level"] = level
        if file_or_room:
            params["fileOrRoom"] = file_or_room

        resp = httpx.get("http://127.0.0.1:5858/api/bridge/logs", params=params, timeout=5.0)
        if resp.status_code == 200:
            data = resp.json()
            logs = data.get("logs", [])
            if not logs:
                return "✅ 수집된 클라이언트 에러/경고 로그가 없습니다 (정상 상태)."
            return json.dumps(logs, ensure_ascii=False, indent=2)
        return f"⚠️ 로그 조회 실패 (HTTP {resp.status_code}): {resp.text}"
    except Exception as e:
        return f"❌ 브릿지 서버 연결 실패: {e}"


@mcp.tool()
def diagnose_canvas_health() -> str:
    """
    [CEO-1151 / DRAW-7] 캔버스 클라이언트 및 브릿지 인프라의 전반적인 건강 상태와 에러 발생률을 진단합니다.
    """
    try:
        resp = httpx.get("http://127.0.0.1:5858/api/bridge/health", timeout=5.0)
        if resp.status_code == 200:
            data = resp.json()
            status = data.get("status", "unknown")
            icon = "🟢" if status == "healthy" else ("🟡" if status == "degraded" else "🔴")
            report = [
                f"{icon} 캔버스 헬스 리포트: {status.upper()}",
                f"- 활성 웹소켓 클라이언트: {data.get('activeClients', 0)}개",
                f"- 최근 5분간 에러 수: {data.get('recentErrorCount', 0)}건",
                f"- 서버 가동 시간: {data.get('uptimeSeconds', 0)}초",
                f"- 누적 진단 로그: {data.get('totalLogsStored', 0)}건",
            ]
            if data.get("latestError"):
                err = data["latestError"]
                report.append(f"\n최근 에러 요약: [{err.get('type')}] {err.get('message')}")
                if err.get("stack"):
                    report.append(f"스택:\n{err.get('stack')[:300]}...")
            return "\n".join(report)
        return f"⚠️ 헬스체크 실패 (HTTP {resp.status_code}): {resp.text}"
    except Exception as e:
        return f"❌ 브릿지 서버 연결 실패: {e}"


def _run_bridge(args: Dict[str, Any]) -> str:
    """Local API Bridge (Fast Path)를 먼저 시도하고, 실패 시 Playwright canvas_bridge.mjs로 Fallback합니다."""
    # 1. Fast Path: Local API Bridge (10ms)
    try:
        bridge_url = os.environ.get("LOCAL_BRIDGE_URL", "http://127.0.0.1:5858/api/bridge/execute")
        resp = httpx.post(bridge_url, json=args, timeout=3.5)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("ok"):
                return json.dumps(data, ensure_ascii=False)
            elif "error" in data:
                print(f"[Local Bridge] Error from bridge: {data.get('error')}, falling back to Playwright")
    except Exception as e:
        # Local bridge unavailable or timeout; fallback to Playwright
        pass

    # 2. Slow Fallback: canvas_bridge.mjs (Playwright + window.editor)
    import subprocess
    import tempfile

    if not os.path.exists(BRIDGE_SCRIPT):
        return f"❌ 오류: bridge 스크립트를 찾을 수 없습니다: {BRIDGE_SCRIPT}"

    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False, encoding="utf-8") as f:
        json.dump(args, f, ensure_ascii=False)
        args_path = f.name

    try:
        proc = subprocess.run(
            ["node", BRIDGE_SCRIPT, args_path],
            cwd=os.path.dirname(BRIDGE_SCRIPT),
            capture_output=True,
            text=True,
            timeout=60,
        )
        stdout = (proc.stdout or "").strip()
        if not stdout:
            return f"❌ 오류: bridge 스크립트가 아무 출력도 반환하지 않았습니다. stderr: {proc.stderr[-2000:]}"

        try:
            result = json.loads(stdout.splitlines()[-1])
        except json.JSONDecodeError:
            return f"❌ 오류: bridge 응답을 파싱할 수 없습니다: {stdout[-2000:]}"

        if not result.get("ok"):
            return f"❌ 오류: {result.get('error', 'unknown error')} (details: {result})"

        return json.dumps(result, ensure_ascii=False)
    except subprocess.TimeoutExpired:
        return "❌ 오류: bridge 스크립트가 60초 내에 응답하지 않았습니다 (타임아웃)."
    finally:
        try:
            os.remove(args_path)
        except OSError:
            pass


if __name__ == "__main__":
    mcp.run()
