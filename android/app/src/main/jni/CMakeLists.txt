# App-level CMake for this module.
#
# Copied from the RN template's default-app-setup/CMakeLists.txt plus two compile
# definitions. The reason it is needed here is specific to this repo layout:
#
# react-native is built from the ../react-native checkout, whose VERSION_NAME is
# 1000.0.0. find_package(ReactAndroid CONFIG) therefore reports
# ReactAndroid_VERSION_MINOR = 0 — the *minor* component of 1000.0.0, not 1000.
# Autolinked libraries use that number to choose their compile flags. react-native-screens
# does this in android/src/main/jni/CMakeLists.txt:
#
#     if(ReactAndroid_VERSION_MINOR GREATER_EQUAL 80)
#       target_compile_reactnative_options(${LIB_TARGET_NAME} PRIVATE)
#     else()
#       target_compile_options(... -DLOG_TAG ... -fexceptions -frtti -std=c++20 -Wall)
#     endif()
#
# With minor == 0 the legacy branch wins, so libreact_codegen_rnscreens.so is built
# *without* RN_SERIALIZABLE_STATE. That macro changes struct layout:
#
#     std::string nativeId;
#     #ifdef RN_SERIALIZABLE_STATE
#       folly::dynamic rawProps = folly::dynamic::object();   // <-- only when defined
#     #endif
#
# Two shared libraries in one process then disagree about the size of Props, and the
# app SIGSEGVs inside convertRawProp<std::string> during
# ComponentDescriptorRegistry::add(), before any JavaScript runs.
#
# Defining both for the whole app build directory gives every non-core native library
# one consistent layout. Core (libreactnative.so) is compiled by ReactAndroid's own
# CMake invocation and already has both.
cmake_minimum_required(VERSION 3.13)

project(appmodules)

add_compile_definitions(
  RN_SERIALIZABLE_STATE
  HERMES_V1_ENABLED=1
)

include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)
