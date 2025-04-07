type LogLevels = 'INFO' | 'ERROR' | 'WARN' | 'CRITICAL'

interface LogData {
	request: {
		id: string | null
		[key: string]: any
	}
	_time: string // match time property in Axiom (avoids two time properties)
	level: LogLevels
	[key: string]: any
}

class Logger {
	private static instance: Logger

	private constructor() {
		// Private constructor to enforce singleton
	}

	public static getInstance(): Logger {
		if (!Logger.instance) {
			Logger.instance = new Logger()
		}
		return Logger.instance
	}

	private async getRequestId(data: Record<string, any>): Promise<string | null> {
		if (data.id) {
			return data.id
		}

		if (data.request?.id) {
			return data.request.id
		}

		// Finally, try to get it from headers if we're in a server component
		try {
			// Only import and use headers() when not in middleware
			// This conditional import helps with compatibility
			const { headers } = await import('next/headers')
			const headersList = await headers()
			return headersList.get('x-request-id')
		} catch (err) {
			// Probably in middleware or another context where headers() doesn't work
			return null
		}
	}

	private async logWithLevel(level: LogLevels, data: Record<string, any>): Promise<void> {
		const _time = new Date().toISOString()
		const requestId = await this.getRequestId(data)
		const processedData = { ...data }

		if (processedData.error) {
			processedData.error = `${processedData.error.constructor.name}: ${processedData.error.message}`
		}

		const logData: LogData = {
			...processedData,
			_time,
			level,
			request: {
				...(data.request || {}),
				id: data.id ? data.id : requestId ? requestId : 'unknown',
			},
		}

		try {
			await fetch(`https://api.axiom.co/v1/datasets/${process.env.AXIOM_DATASET}/ingest`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${process.env.AXIOM_TOKEN}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify([logData]),
			})
		} catch (err) {
			console.error('Axiom logging error:', err)
		}
	}

	public info(data: Record<string, any>): Promise<void> {
		return this.logWithLevel('INFO', data)
	}

	public warn(data: Record<string, any>): Promise<void> {
		return this.logWithLevel('WARN', data)
	}

	public error(data: Record<string, any>): Promise<void> {
		return this.logWithLevel('ERROR', data)
	}

	public critical(data: Record<string, any>): Promise<void> {
		return this.logWithLevel('CRITICAL', data)
	}
}

const log = Logger.getInstance()
export default log
