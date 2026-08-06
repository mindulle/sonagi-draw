import { T } from '@tldraw/validate'
import { createShapePropsMigrationSequence } from '@tldraw/tlschema'


export const WiredCheckboxProps = {
        w: T.number,
        h: T.number,
        isChecked: T.boolean,
        label: T.string
    }

export const WiredCheckboxMigrations = createShapePropsMigrationSequence({
    sequence: []
})


export const WiredMobileFrameProps = {
        w: T.number,
        h: T.number
    }

export const WiredMobileFrameMigrations = createShapePropsMigrationSequence({
    sequence: []
})


export const WiredContainerProps = {
        w: T.number,
        h: T.number
    }

export const WiredContainerMigrations = createShapePropsMigrationSequence({
    sequence: []
})


export const WiredCardProps = {
        w: T.number,
        h: T.number,
        title: T.string
    }

export const WiredCardMigrations = createShapePropsMigrationSequence({
    sequence: []
})


export const WiredButtonProps = {
        w: T.number,
        h: T.number,
        text: T.string,
        color: T.string
    }

export const WiredButtonMigrations = createShapePropsMigrationSequence({
    sequence: []
})


export const WiredToggleProps = {
        w: T.number,
        h: T.number,
        isOn: T.boolean
    }

export const WiredToggleMigrations = createShapePropsMigrationSequence({
    sequence: []
})


export const WiredBarChartProps = {
        w: T.number,
        h: T.number,
        color: T.string,
        values: T.string
    }

export const WiredBarChartMigrations = createShapePropsMigrationSequence({
    sequence: []
})


export const WiredInputProps = {
        w: T.number,
        h: T.number,
        placeholder: T.string
    }

export const WiredInputMigrations = createShapePropsMigrationSequence({
    sequence: []
})


export const WiredBrowserFrameProps = {
        w: T.number,
        h: T.number
    }

export const WiredBrowserFrameMigrations = createShapePropsMigrationSequence({
    sequence: []
})


export const WiredAnnotationPinProps = {
        r: T.number,
        label: T.string,
        color: T.string
    }

export const WiredAnnotationPinMigrations = createShapePropsMigrationSequence({
    sequence: []
})


export const WiredProgressProps = {
        w: T.number,
        h: T.number,
        progress: T.number,
        color: T.string
    }

export const WiredProgressMigrations = createShapePropsMigrationSequence({
    sequence: []
})


export const WiredDonutChartProps = {
        w: T.number,
        h: T.number,
        color: T.string,
        values: T.string
    }

export const WiredDonutChartMigrations = createShapePropsMigrationSequence({
    sequence: []
})


export const WiredDataTableProps = {
        rows: T.number,
        cols: T.number,
        cellWidth: T.number,
        cellHeight: T.number,
        data: T.dict(T.string, T.string)
    }

export const WiredDataTableMigrations = createShapePropsMigrationSequence({
    sequence: []
})


export const WiredUserFlowNodeProps = {
        w: T.number,
        h: T.number,
        title: T.string,
        color: T.string
    }

export const WiredUserFlowNodeMigrations = createShapePropsMigrationSequence({
    sequence: []
})


export const WiredModalProps = {
        w: T.number,
        h: T.number,
        title: T.string
    }

export const WiredModalMigrations = createShapePropsMigrationSequence({
    sequence: []
})


export const customShapeSchemas = {
    'wired-checkbox': { migrations: WiredCheckboxMigrations, props: WiredCheckboxProps },
    'wired-mobile-frame': { migrations: WiredMobileFrameMigrations, props: WiredMobileFrameProps },
    'wired-container': { migrations: WiredContainerMigrations, props: WiredContainerProps },
    'wired-card': { migrations: WiredCardMigrations, props: WiredCardProps },
    'wired-button': { migrations: WiredButtonMigrations, props: WiredButtonProps },
    'wired-toggle': { migrations: WiredToggleMigrations, props: WiredToggleProps },
    'wired-bar-chart': { migrations: WiredBarChartMigrations, props: WiredBarChartProps },
    'wired-input': { migrations: WiredInputMigrations, props: WiredInputProps },
    'wired-browser-frame': { migrations: WiredBrowserFrameMigrations, props: WiredBrowserFrameProps },
    'wired-annotation-pin': { migrations: WiredAnnotationPinMigrations, props: WiredAnnotationPinProps },
    'wired-progress': { migrations: WiredProgressMigrations, props: WiredProgressProps },
    'wired-donut-chart': { migrations: WiredDonutChartMigrations, props: WiredDonutChartProps },
    'wired-data-table': { migrations: WiredDataTableMigrations, props: WiredDataTableProps },
    'wired-user-flow-node': { migrations: WiredUserFlowNodeMigrations, props: WiredUserFlowNodeProps },
    'wired-modal': { migrations: WiredModalMigrations, props: WiredModalProps },
}
