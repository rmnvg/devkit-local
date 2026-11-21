import { shout } from './logic';
it('upper-cases', () => expect(shout('hi there')).toBe('HI THERE'));
it('handles empty', () => expect(shout('')).toBe(''));
