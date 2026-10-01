// The native Android app: the APK this demo installs.
//
// It consumes com.pbb:brownfieldlib from mavenLocal — the fat AAR this repo's `yarn aar`
// publishes from the ../android project. There is no project(:) reference to the React
// Native Gradle project anywhere in here, which is the point: the native app sees exactly
// what a real brownfield integrator sees.
//
//   mavenLocal()          com.pbb:brownfieldlib:0.0.1-local
//   maven /tmp/maven-local  react-android 1000.0.0, i.e. the ../react-native checkout,
//                           which the AAR's POM asks for transitively

pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        mavenLocal()
        maven { url = uri("/tmp/maven-local") }
        google()
        mavenCentral()
    }
}

rootProject.name = "PBBNativeApp"
include(":app")
