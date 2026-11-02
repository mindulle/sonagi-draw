import { DefaultMainMenu, DefaultMainMenuContent, TldrawUiMenuItem, TldrawUiMenuGroup, useEditor } from 'tldraw'
import {
    applyTieredTopologyTemplate,
    applyLinearPipelineTemplate,
    applyHubAndSpokeTemplate,
    apply4TabsTemplate
} from './archetypeTemplates'

export function CustomMainMenu() {
    const editor = useEditor()

    // Expose template applicators for New Drawing modal and external automation
    ;(window as any).__APPLY_ARCHETYPE_TEMPLATE__ = (templateId: string) => {
        if (templateId === 'tiered') applyTieredTopologyTemplate(editor)
        else if (templateId === 'pipeline') applyLinearPipelineTemplate(editor)
        else if (templateId === 'hub-spoke') applyHubAndSpokeTemplate(editor)
        else if (templateId === '4tabs') apply4TabsTemplate(editor)
    }
    ;(window as any).__APPLY_4TABS_TEMPLATE__ = () => apply4TabsTemplate(editor)

    return (
        <DefaultMainMenu>
            {/* @ts-expect-error React 18 type mismatch */}
            <TldrawUiMenuGroup id="file-management">
                <TldrawUiMenuItem
                    id="open-drawing"
                    label="📄 도면 열기 (위키)..."
                    icon="external-link"
                    readonlyOk={true}
                    onSelect={() => {
                        if ((window as any).__OPEN_DRAWING_MODAL__) {
                            (window as any).__OPEN_DRAWING_MODAL__()
                        }
                    }}
                />
                <TldrawUiMenuItem
                    id="new-drawing"
                    label="➕ 새 도면 만들기..."
                    icon="plus"
                    readonlyOk={false}
                    onSelect={() => {
                        if ((window as any).__NEW_DRAWING_PROMPT__) {
                            (window as any).__NEW_DRAWING_PROMPT__()
                        }
                    }}
                />
            </TldrawUiMenuGroup>
            {/* @ts-expect-error React 18 type mismatch */}
            <TldrawUiMenuGroup id="portal-navigation">
                <TldrawUiMenuItem
                    id="open-design-portal"
                    label="🏛️ 디자인 시스템 포털 (design.sonagi.space)..."
                    icon="external-link"
                    readonlyOk={true}
                    onSelect={() => {
                        window.open('https://design.sonagi.space', '_blank')
                    }}
                />
            </TldrawUiMenuGroup>
            {/* @ts-expect-error React 18 type mismatch */}
            <TldrawUiMenuGroup id="custom-templates">
                <TldrawUiMenuItem
                    id="open-asset-drawer"
                    label="🎨 에셋 서랍 (UI 킷 & 토큰)..."
                    icon="layout"
                    readonlyOk={false}
                    onSelect={() => {
                        if ((window as any).__OPEN_ASSET_DRAWER__) {
                            (window as any).__OPEN_ASSET_DRAWER__()
                        }
                    }}
                />
                <TldrawUiMenuItem
                    id="apply-tiered"
                    label="🏗️ 계층형 아키텍처 (Tiered) 삽입"
                    icon="layout"
                    readonlyOk={false}
                    onSelect={() => applyTieredTopologyTemplate(editor)}
                />
                <TldrawUiMenuItem
                    id="apply-pipeline"
                    label="🔄 선형 파이프라인 (Pipeline) 삽입"
                    icon="layout"
                    readonlyOk={false}
                    onSelect={() => applyLinearPipelineTemplate(editor)}
                />
                <TldrawUiMenuItem
                    id="apply-hub-spoke"
                    label="🌐 허브앤스포크 (Hub & Spoke) 삽입"
                    icon="layout"
                    readonlyOk={false}
                    onSelect={() => applyHubAndSpokeTemplate(editor)}
                />
                <TldrawUiMenuItem
                    id="apply-4tabs"
                    label="📌 앱 기획 풀패키지 (4-Tabs) 세팅"
                    icon="layout"
                    readonlyOk={false}
                    onSelect={() => apply4TabsTemplate(editor)}
                />
            </TldrawUiMenuGroup>
            <DefaultMainMenuContent />
        </DefaultMainMenu>
    )
}
