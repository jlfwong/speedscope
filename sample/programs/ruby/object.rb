require 'json'
require 'stackprof'

def a
  for i in 0..2 do
    b
    c
  end
end

def b
  Object.new
end

def c
  for i in 0..5
    (1..10).to_a.sample(3).sort
  end
end

profile = StackProf.run(mode: :object, raw: true) do
  a
end

puts JSON.generate(profile)
