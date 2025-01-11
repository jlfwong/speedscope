import {loadDemangling} from './demangle'

test('demangle', async () => {
  const demangle = await loadDemangling()

  expect(demangle('a')).toBe('a')
  expect(demangle('someUnobfuscatedFunction')).toBe('someUnobfuscatedFunction')

  // C++ mangling
  expect(demangle('__ZNK7Support6ColorFeqERKS0_')).toBe(
    'Support::ColorF::operator==(Support::ColorF const&) const',
  )
  // Running a second time to test the cache
  expect(demangle('__ZNK7Support6ColorFeqERKS0_')).toBe(
    'Support::ColorF::operator==(Support::ColorF const&) const',
  )

  // Rust v0 mangling
  expect(demangle('_RNvCskwGfYPst2Cb_3foo16example_function')).toBe('foo::example_function')

  // Rust legacy mangling
  expect(demangle('_ZN3std2fs8Metadata7created17h8df207f105c5d474E')).toBe('std::fs::Metadata::created::h8df207f105c5d474')
})
