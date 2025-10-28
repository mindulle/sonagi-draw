import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'

function App() {
	
	return (
		<div style={{ position: 'fixed', inset: 0 }}>
			<Tldraw persistenceKey="example" />
		</div>
	)
}

export default App
