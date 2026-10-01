plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
    id("com.facebook.react")
    id("com.callstack.react.brownfield")
    `maven-publish`
}

/**
 * The artifact the native app consumes.
 *
 * com.callstack.react.brownfield turns this library into a single fat AAR: it explodes every
 * autolinked library :app depends on (here that is @callstack/react-native-brownfield itself),
 * merges their classes, resources, manifests and .so files into this module, and folds in the
 * JS bundle :app produced. The published POM then lists those libraries' own third-party
 * dependencies, so the native app resolves them from Maven instead of declaring them by hand.
 */
react {
    autolinkLibrariesWithApp()
}

android {
    namespace = "com.pbb.brownfieldlib"
    compileSdk = 37

    defaultConfig {
        minSdk = 24

        // These drive com.facebook.react.ReactNativeApplicationEntryPoint, which the React
        // Native Gradle Plugin generates for :app and this plugin copies here, rewriting the
        // BuildConfig reference to this module's namespace.
        buildConfigField(
            "boolean",
            "IS_EDGE_TO_EDGE_ENABLED",
            properties["edgeToEdgeEnabled"].toString()
        )
        buildConfigField(
            "boolean",
            "IS_NEW_ARCHITECTURE_ENABLED",
            properties["newArchEnabled"].toString()
        )
        buildConfigField("boolean", "IS_HERMES_ENABLED", properties["hermesEnabled"].toString())
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    publishing {
        multipleVariants {
            allVariants()
        }
    }
}

dependencies {
    // com.pbb.rn's implementation dependencies are embedded from :app's configuration;
    // declaring react-android here is what makes it visible to this module's own source.
    api("com.facebook.react:react-android:1000.0.0")
    api("com.facebook.hermes:hermes-android:260318099.0.2")
}

publishing {
    publications {
        create<MavenPublication>("mavenAar") {
            groupId = "com.pbb"
            artifactId = "brownfieldlib"
            version = "0.0.1-local"
            afterEvaluate {
                from(components.getByName("default"))
            }
        }
    }

    repositories {
        mavenLocal()
    }
}
