export interface Status {
  code: number;
  name: string;
  description: string;
  /** spec that defines it */
  spec: string;
}

export const STATUSES: Status[] = [
  { code: 100, name: 'Continue', description: 'The server got the request headers; the client should send the body (used with Expect: 100-continue).', spec: 'RFC 9110' },
  { code: 101, name: 'Switching Protocols', description: 'The server is switching protocols as asked by the Upgrade header, e.g. to WebSocket.', spec: 'RFC 9110' },
  { code: 103, name: 'Early Hints', description: 'Preliminary headers (usually Link preload hints) sent before the final response.', spec: 'RFC 8297' },
  { code: 200, name: 'OK', description: 'The request succeeded.', spec: 'RFC 9110' },
  { code: 201, name: 'Created', description: 'A new resource was created; the Location header usually points to it.', spec: 'RFC 9110' },
  { code: 202, name: 'Accepted', description: 'The request was accepted for processing, which has not finished (async jobs).', spec: 'RFC 9110' },
  { code: 203, name: 'Non-Authoritative Information', description: 'The payload was modified by a transforming proxy.', spec: 'RFC 9110' },
  { code: 204, name: 'No Content', description: 'Success with no response body (common for DELETE and PUT).', spec: 'RFC 9110' },
  { code: 205, name: 'Reset Content', description: 'Success; the client should reset the document view (e.g. clear a form).', spec: 'RFC 9110' },
  { code: 206, name: 'Partial Content', description: 'Returns only the byte range asked for with a Range header.', spec: 'RFC 9110' },
  { code: 207, name: 'Multi-Status', description: 'WebDAV: the body has status codes for several operations.', spec: 'RFC 4918' },
  { code: 208, name: 'Already Reported', description: 'WebDAV: members were already listed earlier in the response.', spec: 'RFC 5842' },
  { code: 226, name: 'IM Used', description: 'The response is the result of instance manipulations (delta encoding).', spec: 'RFC 3229' },
  { code: 300, name: 'Multiple Choices', description: 'Several representations are available; the client should pick one.', spec: 'RFC 9110' },
  { code: 301, name: 'Moved Permanently', description: 'The resource has a new permanent URL. Clients may change POST to GET when following.', spec: 'RFC 9110' },
  { code: 302, name: 'Found', description: 'Temporary redirect. Clients may change POST to GET when following.', spec: 'RFC 9110' },
  { code: 303, name: 'See Other', description: 'Redirect to another URL with GET, e.g. after a form POST.', spec: 'RFC 9110' },
  { code: 304, name: 'Not Modified', description: 'The cached copy is still valid (conditional GET with If-None-Match / If-Modified-Since).', spec: 'RFC 9110' },
  { code: 307, name: 'Temporary Redirect', description: 'Temporary redirect that keeps the method and body.', spec: 'RFC 9110' },
  { code: 308, name: 'Permanent Redirect', description: 'Permanent redirect that keeps the method and body.', spec: 'RFC 9110' },
  { code: 400, name: 'Bad Request', description: 'The server cannot process the request because it is malformed (bad syntax, invalid JSON, etc.).', spec: 'RFC 9110' },
  { code: 401, name: 'Unauthorized', description: 'Authentication is required or failed. Should include a WWW-Authenticate header.', spec: 'RFC 9110' },
  { code: 402, name: 'Payment Required', description: 'Reserved; some APIs use it for billing or quota problems.', spec: 'RFC 9110' },
  { code: 403, name: 'Forbidden', description: 'The client is authenticated (or not required to be) but is not allowed to do this.', spec: 'RFC 9110' },
  { code: 404, name: 'Not Found', description: 'No resource at this URL (or the server hides that it exists).', spec: 'RFC 9110' },
  { code: 405, name: 'Method Not Allowed', description: 'The resource does not support this HTTP method. Must include an Allow header.', spec: 'RFC 9110' },
  { code: 406, name: 'Not Acceptable', description: 'No representation matches the Accept headers.', spec: 'RFC 9110' },
  { code: 407, name: 'Proxy Authentication Required', description: 'The client must authenticate with the proxy.', spec: 'RFC 9110' },
  { code: 408, name: 'Request Timeout', description: 'The server timed out waiting for the request.', spec: 'RFC 9110' },
  { code: 409, name: 'Conflict', description: 'The request conflicts with the current state (edit conflicts, duplicates).', spec: 'RFC 9110' },
  { code: 410, name: 'Gone', description: 'The resource was permanently removed and will not come back.', spec: 'RFC 9110' },
  { code: 411, name: 'Length Required', description: 'The server requires a Content-Length header.', spec: 'RFC 9110' },
  { code: 412, name: 'Precondition Failed', description: 'A conditional header (If-Match, If-Unmodified-Since) did not match — used for optimistic locking.', spec: 'RFC 9110' },
  { code: 413, name: 'Content Too Large', description: 'The request body is larger than the server allows.', spec: 'RFC 9110' },
  { code: 414, name: 'URI Too Long', description: 'The URL is longer than the server will handle.', spec: 'RFC 9110' },
  { code: 415, name: 'Unsupported Media Type', description: 'The Content-Type of the body is not supported.', spec: 'RFC 9110' },
  { code: 416, name: 'Range Not Satisfiable', description: 'The requested byte range is outside the resource.', spec: 'RFC 9110' },
  { code: 417, name: 'Expectation Failed', description: 'The Expect header cannot be met.', spec: 'RFC 9110' },
  { code: 418, name: "I'm a teapot", description: 'An April Fools’ joke (HTCPCP). Some servers use it to refuse bots.', spec: 'RFC 2324' },
  { code: 421, name: 'Misdirected Request', description: 'The request went to a server that cannot answer for this origin.', spec: 'RFC 9110' },
  { code: 422, name: 'Unprocessable Content', description: 'The syntax is fine but the content fails validation.', spec: 'RFC 9110' },
  { code: 423, name: 'Locked', description: 'WebDAV: the resource is locked.', spec: 'RFC 4918' },
  { code: 424, name: 'Failed Dependency', description: 'WebDAV: the request failed because an earlier request failed.', spec: 'RFC 4918' },
  { code: 425, name: 'Too Early', description: 'The server will not risk processing a request that might be replayed (TLS early data).', spec: 'RFC 8470' },
  { code: 426, name: 'Upgrade Required', description: 'The client must switch to another protocol, given in the Upgrade header.', spec: 'RFC 9110' },
  { code: 428, name: 'Precondition Required', description: 'The server requires a conditional request (to prevent lost updates).', spec: 'RFC 6585' },
  { code: 429, name: 'Too Many Requests', description: 'Rate limited. A Retry-After header may say when to try again.', spec: 'RFC 6585' },
  { code: 431, name: 'Request Header Fields Too Large', description: 'Headers (often cookies) are too large.', spec: 'RFC 6585' },
  { code: 451, name: 'Unavailable For Legal Reasons', description: 'Blocked for legal reasons, such as a court order.', spec: 'RFC 7725' },
  { code: 500, name: 'Internal Server Error', description: 'A generic, unexpected server error.', spec: 'RFC 9110' },
  { code: 501, name: 'Not Implemented', description: 'The server does not support the functionality needed (e.g. an unknown method).', spec: 'RFC 9110' },
  { code: 502, name: 'Bad Gateway', description: 'A gateway or proxy got an invalid response from the upstream server.', spec: 'RFC 9110' },
  { code: 503, name: 'Service Unavailable', description: 'The server is overloaded or down for maintenance. Retry-After may be set.', spec: 'RFC 9110' },
  { code: 504, name: 'Gateway Timeout', description: 'A gateway or proxy timed out waiting for the upstream server.', spec: 'RFC 9110' },
  { code: 505, name: 'HTTP Version Not Supported', description: 'The HTTP version in the request is not supported.', spec: 'RFC 9110' },
  { code: 506, name: 'Variant Also Negotiates', description: 'Content negotiation misconfiguration on the server.', spec: 'RFC 2295' },
  { code: 507, name: 'Insufficient Storage', description: 'WebDAV: the server cannot store what is needed to complete the request.', spec: 'RFC 4918' },
  { code: 508, name: 'Loop Detected', description: 'WebDAV: an infinite loop was found while processing.', spec: 'RFC 5842' },
  { code: 511, name: 'Network Authentication Required', description: 'The client must sign in to the network (captive portal).', spec: 'RFC 6585' },
];

export const CLASSES: Record<number, string> = { 1: 'Informational', 2: 'Success', 3: 'Redirection', 4: 'Client error', 5: 'Server error' };

export function searchStatuses(q: string): Status[] {
  const s = q.trim().toLowerCase();
  if (!s) return STATUSES;
  if (/^\dxx$/.test(s)) return STATUSES.filter((x) => String(x.code)[0] === s[0]);
  if (/^\d{1,3}$/.test(s)) return STATUSES.filter((x) => String(x.code).startsWith(s));
  return STATUSES.filter((x) => `${x.code} ${x.name} ${x.description}`.toLowerCase().includes(s));
}
