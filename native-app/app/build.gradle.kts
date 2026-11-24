plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// AGP 9 rejects the deprecated `android {}` accessor and `kotlinOptions`, so this uses the
// ApplicationExtension DSL and Kotlin compilerOptions.
extensions.configure<com.android.build.api.dsl.ApplicationExtension> {
    namespace = "com.pbb.nativeapp"
    compileSdk = 37

    defaultConfig {
        applicationId = "com.pbb.nativeapp"
        minSdk = 24
        // 36 is where the platform stops calling Activity.onBackPressed() and enforces the
        // predictive back gesture. Everything this demo measures depends on this number.
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"

        // The fat AAR ships arm64 native libraries only.
        ndk { abiFilters += listOf("arm64-v8a") }
    }

    buildFeatures {
        buildConfig = true
    }

    buildTypes {
        debug {
            // Metro is off by default: the AAR carries index.android.bundle, so a plain
            // install works with nothing running. `yarn native:install -PuseMetro=true`
            // switches the same debug build over to the bundler.
            buildConfigField(
                "boolean",
                "USE_METRO",
                (project.findProperty("useMetro") ?: "false").toString()
            )
        }
        release {
            isMinifyEnabled = false
            buildConfigField("boolean", "USE_METRO", "false")
            signingConfig = signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
    }
}

dependencies {
    // Everything React Native: the merged classes of the autolinked libraries, the JS
    // bundle, libappmodules.so, and react-android itself through this POM.
    implementation("com.pbb:brownfieldlib:0.0.1-local")

    implementation("androidx.appcompat:appcompat:1.7.1")
    implementation("androidx.fragment:fragment:1.8.9")
    // handleOnBackStarted / Progressed / Cancelled landed in activity 1.8. NativeHostActivity
    // overrides them to see the swipe while its own callback owns it.
    implementation("androidx.activity:activity:1.8.2")
}
