import { cloneRequest, teeRequest } from '@php-wasm/web-service-worker';

export async function fetchWithCorsProxy(
	input: RequestInfo,
	init?: RequestInit,
	corsProxyUrl?: string
): Promise<Response> {
	const requestObject =
		typeof input === 'string' ? new Request(input, init) : input;
	if (!corsProxyUrl) {
		return await fetch(requestObject);
	}

	// Tee the request to avoid consuming the request body stream on the initial
	// fetch() so that we can retry through the cors proxy.
	const [request1, request2] = await teeRequest(requestObject);

	try {
		return await fetch(request1);
	} catch {
		const newRequest = await cloneRequest(request2, {
			url: `${corsProxyUrl}${requestObject.url}`,
		});

		return await fetch(newRequest, init);
	}
}
