# @react-native-community/netinfo Knowledge Base

**Comprehensive documentation for React Native NetInfo library v11.4.1 and above**

## Framework Overview

The `@react-native-community/netinfo` library provides a unified API for detecting network state and connection type across Android, iOS, macOS, Windows, and Web platforms. It exposes real-time connection information including network type (WiFi, cellular, ethernet, etc.), internet reachability status, and platform-specific network details (SSID, signal strength, carrier information, etc.).

## Quick Links

- **GitHub Repository**: https://github.com/react-native-netinfo/react-native-netinfo
- **NPM Package**: https://www.npmjs.com/package/@react-native-community/netinfo
- **Latest Version**: v11.4.1 (September 20, 2024)

---

## Table of Contents

### 1. **Getting Started** → [01-setup.md](./01-setup.md)
Installation instructions for all platforms (Android, iOS, macOS, Windows, Web), React Native compatibility requirements, manual linking procedures, and initial configuration. Essential for first-time setup and troubleshooting platform-specific issues.

### 2. **Core API Reference** → [02-api-core.md](./02-api-core.md)
Type definitions (`NetInfoState`, `NetInfoStateType`, `NetInfoCellularGeneration`) and fundamental methods (`fetch()`, `refresh()`, `addEventListener()`, `useNetInfo()`). Master API documentation for the global instance with typed parameters and return values.

### 3. **Advanced API & Configuration** → [03-api-advanced.md](./03-api-advanced.md)
Advanced configuration options (`NetInfoConfiguration`), isolated instance management (`useNetInfoInstance()`), custom reachability testing, performance tuning, and platform-specific capabilities. For developers requiring fine-grained control over network state detection.

### 4. **Usage Guides & Patterns** → [04-guides.md](./04-guides.md)
Real-world patterns for offline-first apps, connection quality detection, network monitoring, platform-specific SSID/BSSID retrieval, iOS background behavior, and migration examples. Practical implementation strategies with code samples.

### 5. **Troubleshooting & Platform Issues** → [05-troubleshooting.md](./05-troubleshooting.md)
Solutions for Android build errors, Jest testing configuration, iOS simulator limitations, WiFi switching behavior, and browser compatibility. Debugging strategies for common platform-specific issues.

### 6. **Type Reference & Enums** → [06-types.md](./06-types.md)
Complete TypeScript type definitions, enums, interface structures, and platform compatibility matrix. Authoritative source for understanding type contracts across all library exports.

---

## Library Statistics

| Metric | Value |
|--------|-------|
| **Latest Release** | v11.4.1 (September 20, 2024) |
| **Minimum React Native** | 0.60+ (with auto-linking) |
| **Supported Platforms** | Android, iOS, macOS, Windows, Web |
| **Language Breakdown** | TypeScript (44%), Java (25.7%), Objective-C (13.2%), C++ (9.7%), JavaScript (5.1%) |
| **GitHub Stars** | 2.1k+ |
| **Active Contributors** | 160+ |
| **Used By** | 62,400+ projects |
| **License** | MIT |

---

## Feature Matrix by Platform

| Feature | Android | iOS | macOS | Windows | Web |
|---------|---------|-----|-------|---------|-----|
| Connection Type Detection | ✓ | ✓ | ✓ | ✓ | ✓ |
| Cellular Support | ✓ | ✓ | ✗ | ✓ | ✓ |
| WiFi Details (SSID/BSSID) | ✓ | ✓* | ✗ | ✓* | ✗ |
| Signal Strength | ✓ | ✗ | ✗ | ✓ | ✗ |
| Ethernet Detection | ✓ | ✗ | ✓ | ✓ | ✓ |
| VPN Detection | ✓ | ✗ | ✗ | ✗ | ✗ |
| Reachability Testing | ✓ | ✓ | ✓ | ✓ | ✓ |
| IPv6 Support | ✓ | ✓ | ✓ | ✓ | ✓ |

*iOS and Windows require specific permissions/capabilities to retrieve SSID/BSSID

---

## Key Concepts

### Global vs. Isolated Instance

**Global Instance** (Recommended for most apps)
- Single shared network state manager
- Use `fetch()`, `addEventListener()`, `useNetInfo()`
- Efficient for apps needing simple network state
- Configuration is global

**Isolated Instance** (For advanced scenarios)
- Create separate instances per component/feature
- Use `useNetInfoInstance()`
- Each instance maintains independent state
- Configuration is local to the instance

### Network State Model

Every network state object contains:
- **`type`**: Current connection type (`none`, `wifi`, `cellular`, `ethernet`, etc.)
- **`isConnected`**: Active network connection (boolean or null)
- **`isInternetReachable`**: Internet connectivity via active network (boolean or null)
- **`isWifiEnabled`**: Android-only flag for WiFi hardware state
- **`details`**: Platform-specific metadata (varies by connection type)

---

## Getting Help

- **Issues & Bugs**: https://github.com/react-native-netinfo/react-native-netinfo/issues
- **Discussions**: https://github.com/react-native-netinfo/react-native-netinfo/discussions
- **npm Package**: https://www.npmjs.com/package/@react-native-community/netinfo

---

## Navigation Guide for LLM Routing

| Use Case | Module |
|----------|--------|
| "How do I install?" | 01-setup.md |
| "What does `NetInfoState` look like?" | 02-api-core.md |
| "How do I use the hook?" | 02-api-core.md → 04-guides.md |
| "What about custom reachability?" | 03-api-advanced.md |
| "How do I get WiFi SSID?" | 04-guides.md → 02-api-core.md (WiFi details) |
| "My app isn't detecting network changes" | 05-troubleshooting.md |
| "What are the types?" | 06-types.md |
| "How to test with Jest?" | 05-troubleshooting.md |
| "iOS background issues" | 05-troubleshooting.md → 04-guides.md |

---

**Last Updated**: December 27, 2025  
**Library Version**: 11.4.1  
**Status**: Complete and verified
