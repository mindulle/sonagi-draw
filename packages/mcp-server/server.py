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

# Tldraw DB 경로 (컨테이너 볼륨 마운트 경로)
DB_DIR = "/home/ubuntu/sonagi-draw-prod/.rooms"
TEMPLATE_DIR = "/home/ubuntu/sonagi-draw-prod/.templates"

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
            ("page:moodboard", json.dumps({"meta":{},"id":"page:moodboard","name":"🎨 Moodboard","index":"a1","typeName":"page"}).encode('utf-8'), ts),
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

def create_text_shape(x: float, y: float, text: str, color: str = "black", size: str = "m", parent_id: str = "page:moodboard"):
    return {
        "x": x, "y": y, "rotation": 0, "isLocked": False, "opacity": 1, "meta": {}, 
        "id": f"shape:{uuid.uuid4()}", "type": "text", 
        "props": {"color": color, "size": size, "w": 200, "richText": to_rich_text(text), "font": "draw", "textAlign": "middle", "autoSize": True, "scale": 1},
        "parentId": parent_id, "index": get_next_index(), "typeName": "shape"
    }

def create_rect_shape(x: float, y: float, w: float, h: float, color: str = "black", fill: str = "solid", parent_id: str = "page:moodboard"):
    return {
        "x": x, "y": y, "rotation": 0, "isLocked": False, "opacity": 1, "meta": {}, 
        "id": f"shape:{uuid.uuid4()}", "type": "geo", 
        "props": {"w": w, "h": h, "geo": "rectangle", "color": color, "labelColor": "black", "fill": fill, "dash": "draw", "size": "m", "font": "draw", "richText": to_rich_text(""), "align": "middle", "verticalAlign": "middle", "growY": 0, "url": "", "scale": 1}, 
        "parentId": parent_id, "index": get_next_index(), "typeName": "shape"
    }

def create_note_shape(x: float, y: float, text: str, color: str = "yellow", size: str = "m", parent_id: str = "page:moodboard"):
    return {
        "x": x, "y": y, "rotation": 0, "isLocked": False, "opacity": 1, "meta": {}, 
        "id": f"shape:{uuid.uuid4()}", "type": "note", 
        "props": {"color": color, "size": size, "richText": to_rich_text(text), "font": "draw", "align": "middle", "verticalAlign": "middle", "growY": 0, "url": "", "scale": 1, "fontSizeAdjustment": None, "labelColor": "black", "textLastEditedBy": None},
        "parentId": parent_id, "index": get_next_index(), "typeName": "shape"
    }

def add_image_with_asset(db_path: str, x: float, y: float, w: float, h: float, url: str, parent_id: str = "page:moodboard"):
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
        add_shape_to_db(db_path, create_text_shape(100, 50, f"🎨 {title}", size="xl", parent_id="page:moodboard"))
        if issue_id:
            add_shape_to_db(db_path, create_text_shape(100, 120, f"🔗 Associated with Issue: {issue_id}", color="blue", size="s", parent_id="page:moodboard"))
        
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
def add_sticky_note(room_id: str, text: str, x: float, y: float, color: str = "yellow") -> str:
    """
    [Phase 3] 캔버스 특정 위치에 피드백이나 코멘트를 남길 수 있는 포스트잇(Sticky Note)을 붙입니다.
    color는 tldraw 지원 색상(yellow, blue, green, red, black, white 등) 중 하나여야 합니다.
    """
    db_path = get_db_path(room_id)
    if not os.path.exists(db_path):
        return f"❌ 오류: Room ID '{room_id}'가 존재하지 않습니다."
        
    add_shape_to_db(db_path, create_note_shape(x, y, text, color=color))
    return f"✅ 포스트잇 부착 완료: Room {room_id} (x:{x}, y:{y}, text:'{text}')"

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

if __name__ == "__main__":
    mcp.run()
