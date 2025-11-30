export async function coolGetFetch(url, setter, setLoading) {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    setter(data)
    setLoading?.(false)
  } catch (err) {
    console.error('Fetch failed:', err)
    setLoading?.(false)
  }
}

export async function coolPostFetch(url, setter, setLoading) {
  try {
    const response = await fetch(url, { method: 'POST' })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    setter(data)
    setLoading?.(false)
  } catch (err) {
    console.error('Fetch failed:', err)
    setLoading?.(false)
  }
}
