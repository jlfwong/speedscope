require 'json'
require 'stackprof'

def a
  for i in 0..100 do
    b
    c
    e
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

def e
  sleep 0.05
end

mode = (ARGV[0] || :wall).to_sym
profile = StackProf.run(mode: mode, raw: true) do
  a
end

puts JSON.generate(profile)
