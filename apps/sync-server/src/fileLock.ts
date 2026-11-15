/**
 * 파일 단위 직렬화 락.
 *
 * file-store fallback 은 `.tldr` 를 읽고 → 수정하고 → 통째로 다시 쓰는
 * read-modify-write 구조다. 두 요청이 겹치면 한쪽 변경이 유실되므로
 * 같은 파일에 대한 작업을 순서대로 실행한다.
 */
const locks = new Map<string, Promise<unknown>>()

export function withFileLock<T>(key: string, fn: () => Promise<T> | T): Promise<T> {
	const prior = locks.get(key) ?? Promise.resolve()
	const result = prior.then(fn, fn)
	const tail = result.then(
		() => undefined,
		() => undefined
	)
	locks.set(key, tail)
	void tail.finally(() => {
		if (locks.get(key) === tail) locks.delete(key)
	})
	return result
}
