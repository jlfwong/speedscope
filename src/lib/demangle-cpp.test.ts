import {demangleCpp} from './demangle-cpp'

test('demangleCpp', () => {
  expect(demangleCpp('a')).toBe('a')
  expect(demangleCpp('someUnobfuscatedFunction')).toBe('someUnobfuscatedFunction')
  expect(demangleCpp('__ZNK7Support6ColorFeqERKS0_')).toBe(
    'Support::ColorF::operator==(Support::ColorF const&) const',
  )
})
