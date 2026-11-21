import { CASES, convertLines, words } from './logic';

describe('case converter', () => {
  it('splits identifiers in any style', () => {
    expect(words('parseHTTPResponse_v2-final')).toEqual(['parse', 'HTTP', 'Response', 'v2', 'final']);
    expect(words('XMLHttpRequest')).toEqual(['XML', 'Http', 'Request']);
    expect(words('  user  id ')).toEqual(['user', 'id']);
    expect(words('café_crème')).toEqual(['café', 'crème']);
  });
  it('converts to every case', () => {
    const s = 'get user ID by email';
    expect(CASES.camel(s)).toBe('getUserIdByEmail');
    expect(CASES.pascal(s)).toBe('GetUserIdByEmail');
    expect(CASES.snake(s)).toBe('get_user_id_by_email');
    expect(CASES.constant(s)).toBe('GET_USER_ID_BY_EMAIL');
    expect(CASES.kebab(s)).toBe('get-user-id-by-email');
    expect(CASES.train(s)).toBe('Get-User-Id-By-Email');
    expect(CASES.dot(s)).toBe('get.user.id.by.email');
    expect(CASES.path(s)).toBe('get/user/id/by/email');
    expect(CASES.title('the lord of the rings')).toBe('The Lord of the Rings');
    expect(CASES.sentence('HELLO_WORLD again')).toBe('Hello world again');
  });
  it('converts line by line and handles empty input', () => {
    expect(convertLines('userId\n\nfirst_name', 'kebab')).toBe('user-id\n\nfirst-name');
    expect(CASES.camel('')).toBe('');
  });
});
