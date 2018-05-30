require 'json'
require 'stackprof'

def a
  for i in 0..100 do
    b
    c
  end
end

def b
  for i in 0..10
    d
  end
end

def c
  for i in 0..10
    d
  end
end

def d
  prod = 1
  for i in 1..1000
    prod *= i
  end
  prod
end

profile = StackProf.run(mode: :wall, raw: true) do
  a
end

puts JSON.generate(profile)