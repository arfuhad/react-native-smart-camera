require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'react-native-smart-camera'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = { :ios => '13.4' }
  s.swift_version  = '5.4'
  s.source         = { git: package['repository']['url'], tag: "v#{s.version}" }
  s.static_framework = true

  s.source_files = "ios/**/*.{h,m,mm,swift}"
  
  # React Native dependency
  s.dependency 'React-Core'
  
  # VisionCamera for frame processor API
  s.dependency 'VisionCamera'
  
  # Google ML Kit Face Detection
  s.dependency 'GoogleMLKit/FaceDetection', '~> 5.0.0'

  # Exclude test files
  s.exclude_files = "ios/Tests/**/*"
end

