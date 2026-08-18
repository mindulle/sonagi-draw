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

# Tldraw DB 경로 (llmops 로컬 미러 - Syncthing으로 devops:/home/mindulle/sonagi-draw/data와 동기화됨)
# 주의: get_room_state 등 "읽기 전용" 조회 도구만 이 경로를 직접 사용합니다.
# 도형을 "쓰는" 모든 도구(push_to_inbox 등)는 이제 SQLite를 직접 건드리지 않고
# bridge/canvas_bridge.mjs를 통해 실제 Tldraw Editor API로 안전하게 기록합니다.
DB_DIR = "/home/ubuntu/sonagi-draw-prod/.rooms"
TEMPLATE_DIR = "/home/ubuntu/sonagi-draw-prod/.templates"

# canvas_bridge.mjs 위치 및 배포된 화이트보드 URL (Nginx 프록시 경유)
BRIDGE_SCRIPT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "bridge", "canvas_bridge.mjs")
DRAW_BASE_URL = "https://draw.sonagi.space"

import string

# 전역 인덱스 카운터 (Fractional Index 충돌 방지용)
_index_counter = 0
def get_next_index():
    global _index_counter
    _index_counter += 1
    return f"c{_index_counter:03d}"

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

def get_db_path(room_id: str) -> str:
    return os.path.join(DB_DIR, f"{room_id}.db")

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

def add_shape_to_db(db_path: str, item_dict: dict):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("SELECT MAX(lastChangedClock) FROM documents")
    row = c.fetchone()
    clock = (row[0] if row[0] is not None else 0) + 1
    
    c.execute("INSERT INTO documents (id, state, lastChangedClock) VALUES (?, ?, ?)", 
              (item_dict["id"], json.dumps(item_dict).encode('utf-8'), clock))
    conn.commit()
    conn.close()

def to_rich_text(text: str) -> dict:
    lines = text.split("\n")
    content = []
    for line in lines:
        if not line:
            content.append({"type": "paragraph", "content": []})
        else:
            content.append({
                "type": "paragraph",
                "content": [{"type": "text", "text": line}]
            })
    return {"type": "doc", "content": content}

def create_text_shape(x: float, y: float, text: str, color: str = "black", size: str = "m", parent_id: str = "page:page"):
    return {
        "x": x, "y": y, "rotation": 0, "isLocked": False, "opacity": 1, "meta": {}, 
        "id": f"shape:{uuid.uuid4()}", "type": "text", 
        "props": {"color": color, "size": size, "w": 200, "richText": to_rich_text(text), "font": "draw", "textAlign": "middle", "autoSize": True, "scale": 1},
        "parentId": parent_id, "index": get_next_index(), "typeName": "shape"
    }

def create_rect_shape(x: float, y: float, w: float, h: float, color: str = "black", fill: str = "solid", parent_id: str = "page:page"):
    return {
        "x": x, "y": y, "rotation": 0, "isLocked": False, "opacity": 1, "meta": {}, 
        "id": f"shape:{uuid.uuid4()}", "type": "geo", 
        "props": {"w": w, "h": h, "geo": "rectangle", "color": color, "labelColor": "black", "fill": fill, "dash": "draw", "size": "m", "font": "draw", "richText": to_rich_text(""), "align": "middle", "verticalAlign": "middle", "growY": 0, "url": "", "scale": 1}, 
        "parentId": parent_id, "index": get_next_index(), "typeName": "shape"
    }

def create_note_shape(x: float, y: float, text: str, color: str = "yellow", size: str = "m", parent_id: str = "page:page"):
    return {
        "x": x, "y": y, "rotation": 0, "isLocked": False, "opacity": 1, "meta": {}, 
        "id": f"shape:{uuid.uuid4()}", "type": "note", 
        "props": {"color": color, "size": size, "richText": to_rich_text(text), "font": "draw", "align": "middle", "verticalAlign": "middle", "growY": 0, "url": "", "scale": 1, "fontSizeAdjustment": None, "labelColor": "black", "textLastEditedBy": None},
        "parentId": parent_id, "index": get_next_index(), "typeName": "shape"
    }

def add_image_with_asset(db_path: str, x: float, y: float, w: float, h: float, url: str, parent_id: str = "page:page"):
    # 외부 이미지를 CDN으로 이주 (Hotlinking 방어)
    cdn_url = upload_image_to_cdn(url)
    
    asset_id = f"asset:{uuid.uuid4()}"
    asset_dict = {
        "id": asset_id,
        "type": "image",
        "typeName": "asset",
        "props": {
            "name": "image.png",
            "src": cdn_url,
            "w": w,
            "h": h,
            "isAnimated": False,
            "mimeType": "image/jpeg"
        },
        "meta": {}
    }
    image_shape = {
        "x": x, "y": y, "rotation": 0, "isLocked": False, "opacity": 1, "meta": {}, 
        "id": f"shape:{uuid.uuid4()}", "type": "image", 
        "props": {"w": w, "h": h, "playing": True, "url": "", "assetId": asset_id, "crop": None, "flipX": False, "flipY": False, "altText": ""},
        "parentId": parent_id, "index": get_next_index(), "typeName": "shape"
    }
    add_shape_to_db(db_path, asset_dict)
    add_shape_to_db(db_path, image_shape)


@mcp.tool()
def create_room(title: str, issue_id: Optional[str] = None, template_name: str = "default") -> str:
    """
    신규 tldraw 방을 생성하고 3개의 멀티 페이지(Moodboard, Wireframe, User Journey)를 기본 세팅합니다.
    template_name을 지정하여 특정 템플릿 기반으로 생성할 수 있습니다.
    """
    os.makedirs(DB_DIR, exist_ok=True)
    room_id = uuid.uuid4().hex[:8]
    db_path = get_db_path(room_id)
    
    init_db(db_path, template_name)
    
    if template_name == "default":
        # Page 1: Moodboard 타이틀
        add_shape_to_db(db_path, create_text_shape(100, 50, f"🎨 {title}", size="xl", parent_id="page:page"))
        if issue_id:
            add_shape_to_db(db_path, create_text_shape(100, 120, f"🔗 Associated with Issue: {issue_id}", color="blue", size="s", parent_id="page:page"))
        
        # Page 2: Wireframe & UI Kit 초기 세팅
        generate_wireframe_kit(room_id)
        
        # Page 3: User Journey 초기 세팅
        generate_user_journey(room_id)
        
    room_url = f"https://draw.sonagi.space/?room={room_id}"
    return f"✅ 방 생성 완료: {room_url}"

def generate_wireframe_kit(room_id: str):
    db_path = get_db_path(room_id)
    # Mobile frame
    add_shape_to_db(db_path, create_rect_shape(100, 200, 375, 812, color="grey", fill="none", parent_id="page:wireframe"))
    add_shape_to_db(db_path, create_text_shape(100, 150, "📱 Mobile App", size="m", parent_id="page:wireframe"))
    
    # Web frame
    add_shape_to_db(db_path, create_rect_shape(600, 200, 1280, 800, color="grey", fill="none", parent_id="page:wireframe"))
    add_shape_to_db(db_path, create_text_shape(600, 150, "💻 Web Desktop", size="m", parent_id="page:wireframe"))
    
    # UI Kit Components (Buttons, inputs)
    add_shape_to_db(db_path, create_text_shape(100, 1100, "📦 UI Kit (Drag & Drop)", size="l", parent_id="page:wireframe"))
    add_shape_to_db(db_path, create_rect_shape(100, 1160, 150, 48, color="blue", fill="semi", parent_id="page:wireframe")) # Button
    add_shape_to_db(db_path, create_text_shape(125, 1172, "Primary Btn", color="white", size="s", parent_id="page:wireframe"))
    add_shape_to_db(db_path, create_rect_shape(300, 1160, 200, 48, color="grey", fill="none", parent_id="page:wireframe")) # Input
    add_shape_to_db(db_path, create_text_shape(320, 1172, "Input text...", size="s", color="grey", parent_id="page:wireframe"))

def generate_user_journey(room_id: str):
    db_path = get_db_path(room_id)
    add_shape_to_db(db_path, create_text_shape(100, 100, "🗺️ User Journey Flowchart", size="xl", parent_id="page:journey"))
    add_shape_to_db(db_path, create_note_shape(100, 200, "1. 사용자가 랜딩 페이지 접속\n(스크롤 유도)", color="blue", parent_id="page:journey"))
    add_shape_to_db(db_path, create_note_shape(400, 200, "2. CTA 버튼 클릭\n(가입 모달 노출)", color="yellow", parent_id="page:journey"))
    add_shape_to_db(db_path, create_note_shape(700, 200, "3. 결제 및 온보딩 완료\n(대시보드 이동)", color="green", parent_id="page:journey"))

@mcp.tool()
def generate_moodboard_layout(room_id: str, image_urls: List[str], palette_hex: List[str], rules: str) -> str:
    """
    [Phase 1] 이미지 배열, 컬러 팔레트, 텍스트 규칙을 tldraw 캔버스에 시각적으로 정렬하여 렌더링합니다.
    """
    db_path = get_db_path(room_id)
    if not os.path.exists(db_path):
        return f"❌ 오류: Room ID '{room_id}'가 존재하지 않습니다."
    
    # 1. 텍스트 룰스 (우측 배치)
    add_shape_to_db(db_path, create_text_shape(800, 200, "📌 Design Rules", size="l"))
    add_shape_to_db(db_path, create_text_shape(800, 260, rules, size="m"))
    
    # 2. 컬러 팔레트 텍스트 가이드 (우측 하단)
    add_shape_to_db(db_path, create_text_shape(800, 500, "🎨 Color Palette (Reference)", size="l"))
    for i, hex_code in enumerate(palette_hex):
        x_pos = 800 + (i * 120)
        # 헥스 코드 텍스트만 남김 (어색한 검은색 사각형 도형 제거)
        add_shape_to_db(db_path, create_text_shape(x_pos, 540, hex_code, size="s"))
        
    # 3. 이미지 그리드 (좌측 배치)
    start_x, start_y = 100, 200
    gap = 20
    img_w, img_h = 300, 300
    
    for i, url in enumerate(image_urls):
        col = i % 2
        row = i // 2
        x = start_x + col * (img_w + gap)
        y = start_y + row * (img_h + gap)
        add_image_with_asset(db_path, x, y, img_w, img_h, url)
        
    return f"✅ 무드보드 레이아웃 완료 (Images: {len(image_urls)}, Palette: {len(palette_hex)})"

@mcp.tool()
def add_sticky_note(room_id: str, text: str, x: float, y: float, color: str = "yellow", page_id: str = "page:wireframe") -> str:
    """
    [Phase 3] 캔버스 특정 위치에 피드백이나 코멘트를 남길 수 있는 포스트잇(Sticky Note)을 붙입니다.
    color는 tldraw 지원 색상(yellow, blue, green, red, black, white 등) 중 하나여야 합니다.
    """
    if not room_id or not all(c.isalnum() or c in "-_" for c in room_id):
        return "❌ 오류: 올바르지 않은 Room ID 형식입니다."

    db_path = get_db_path(room_id)
    if not os.path.exists(db_path):
        return f"❌ 오류: Room ID '{room_id}'가 존재하지 않습니다."

    # CEO-933: routed through canvas_bridge.mjs (real window.editor API) instead
    # of add_shape_to_db's raw SQL INSERT, which could write shapes with
    # non-conformant fractional indices and crash sync-server on load.
    args = {
        "action": "add_sticky_note",
        "baseUrl": DRAW_BASE_URL,
        "roomId": room_id,
        "pageId": page_id,
        "text": text,
        "x": x,
        "y": y,
        "color": color,
    }
    return _run_bridge(args)

@mcp.tool()
def add_wireframe_box(room_id: str, x: float, y: float, w: float, h: float, text: str = "", page_id: str = "page:wireframe") -> str:
    """
    캔버스의 특정 페이지에 기본적인 와이어프레임 박스(회색 윤곽선)를 그립니다. (UI/UX 뼈대 잡기용)
    선택적으로 박스 중앙에 들어갈 텍스트(예: "네비게이션", "메인 버튼")를 지정할 수 있습니다.
    """
    if not room_id or not all(c.isalnum() or c in "-_" for c in room_id):
        return "❌ 오류: 올바르지 않은 Room ID 형식입니다."

    if w <= 0 or h <= 0:
        return "❌ 오류: 와이어프레임 박스의 너비(w)와 높이(h)는 0보다 커야 합니다."

    db_path = get_db_path(room_id)
    if not os.path.exists(db_path):
        return f"❌ 오류: Room ID '{room_id}'가 존재하지 않습니다."

    # CEO-933: routed through canvas_bridge.mjs, see add_sticky_note above.
    args = {
        "action": "add_wireframe_box",
        "baseUrl": DRAW_BASE_URL,
        "roomId": room_id,
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
    page_id(예: 'page:wireframe')를 지정하면 해당 페이지 내의 모든 도형만 필터링하여 반환합니다.
    """
    db_path = get_db_path(room_id)
    if not os.path.exists(db_path):
        return {"error": f"Room ID '{room_id}' not found."}
        
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    # 페이지 목록 조회
    c.execute("SELECT state FROM documents WHERE id LIKE 'page:%'")
    pages = [json.loads(row[0]) for row in c.fetchall()]
    
    # 전체 도형 조회
    c.execute("SELECT state FROM documents WHERE id LIKE 'shape:%'")
    all_shapes = [json.loads(row[0]) for row in c.fetchall()]
    conn.close()
    
    # 특정 페이지 필터링 로직 (Frame이나 Group 안에 묶인 도형까지 전부 찾기 위한 트리 순회)
    if page_id:
        target_shapes = []
        parent_ids_to_search = {page_id}
        
        while parent_ids_to_search:
            next_parent_ids = set()
            for shape in all_shapes:
                if shape.get("parentId") in parent_ids_to_search:
                    target_shapes.append(shape)
                    next_parent_ids.add(shape["id"])
                    
            # 이미 타겟으로 잡힌 도형은 탐색 풀에서 제외 (무한루프 및 중복 방지)
            all_shapes = [s for s in all_shapes if s["id"] not in next_parent_ids]
            parent_ids_to_search = next_parent_ids
            
        shapes_to_return = target_shapes
    else:
        shapes_to_return = all_shapes
        
    return {
        "room_id": room_id,
        "page_id": page_id or "all",
        "available_pages": [{"id": p.get("id"), "name": p.get("name")} for p in pages],
        "total_shapes": len(shapes_to_return),
        "shapes": shapes_to_return
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
        "pageName": page_name,
    }
    result = json.loads(_run_bridge(args))
    return result


def _run_bridge(args: Dict[str, Any]) -> str:
    """canvas_bridge.mjs (Playwright + window.editor)를 서브프로세스로 실행하고 결과를 반환합니다."""
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
