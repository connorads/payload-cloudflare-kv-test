import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const GET = async () => {
  const payload = await getPayload({ config: configPromise })

  try {
    // Test write
    await payload.kv.set('test-key', {
      message: 'Hello from KV!',
      timestamp: new Date().toISOString(),
    })

    // Test read
    const data = await payload.kv.get('test-key')

    // Test keys listing
    const keys = await payload.kv.keys()

    return Response.json({
      success: true,
      data,
      keys,
      message: 'KV is working!',
    })
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
