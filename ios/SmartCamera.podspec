require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'SmartCamera'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = { :ios => '13.4' }
  s.swift_version  = '5.4'
  s.source         = { git: 'https://github.com/user/react-native-smart-camera.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  
  # Google ML Kit Face Detection
  # Note: This requires a minimum iOS deployment target of 13.0
  # s.dependency 'GoogleMLKit/FaceDetection', '~> 5.0.0'

  # Don't install the dependencies when we run `pod install` in the old architecture.
  if ENV['RCT_NEW_ARCH_ENABLED'] == '1'
    s.compiler_flags = '-DRCT_NEW_ARCH_ENABLED -Wno-comma -Wno-shorten-64-to-32'
  end

  s.source_files = "**/*.{h,m,mm,swift}"
  
  # Exclude test files
  s.exclude_files = "Tests/**/*"
end
