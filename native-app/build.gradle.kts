// The native Android app. No React Native Gradle Plugin anywhere in here, which is the
// point. Everything React Native comes from com.pbb:brownfieldlib (settings.gradle.kts).
//
// AGP and Kotlin match what ../android resolves through the React Native Gradle Plugin
// (packages/gradle-plugin/gradle/libs.versions.toml), so both projects read the same
// kotlin-stdlib metadata the fat AAR was compiled against.

plugins {
    id("com.android.application") version "9.2.1" apply false
    id("org.jetbrains.kotlin.android") version "2.2.10" apply false
}
