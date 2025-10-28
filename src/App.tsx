import { Tldraw, toRichText } from 'tldraw'
import { useSyncDemo } from '@tldraw/sync'
import 'tldraw/tldraw.css'

function App() {
	const store = useSyncDemo({ roomId: 'insert-any-string-here' })

		const handleMount = (editor) => {
		editor.createShape({
			type: 'text',
			x: 200,
			y: 200,
			props: {
				richText: toRichText('Hello world!'),
			},
		})

		editor.selectAll()

		editor.zoomToSelection({
			animation: { duration: 5000 },
		})
	}

	return (
		<div style={{ position: 'fixed', inset: 0 }}>
			<Tldraw persistenceKey="example" />
		</div>
	)
}

export default App
