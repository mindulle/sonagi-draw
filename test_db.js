const Database = require('better-sqlite3');
const db = new Database('/home/mindulle/sonagi-draw/data/.rooms/1mbvv0qd.db');
const row = db.prepare('SELECT * FROM metadata').get();
console.log("Persisted:", row.schema);

const { createTLSchema, defaultShapeSchemas } = require('@tldraw/tlschema');
const { customShapeSchemas } = require('@sonagi-draw/schema');

const schema = createTLSchema({
	shapes: { ...defaultShapeSchemas, ...customShapeSchemas }
});
console.log("Current Sequences:", schema.serialize().sequences);

const res = schema.getMigrationsSince(JSON.parse(row.schema));
console.log("Migration Result:", res);
