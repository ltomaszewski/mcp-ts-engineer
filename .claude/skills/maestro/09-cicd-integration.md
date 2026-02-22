# MODULE 9: CI/CD INTEGRATION

## GitHub Actions

### Workflow Setup

**`.github/workflows/maestro-tests.yml`:**

```yaml
name: Maestro E2E Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  test:
    runs-on: macos-latest
    timeout-minutes: 60
    
    strategy:
      matrix:
        device: ['iPhone 14', 'Pixel 6']
    
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Install Maestro
        run: curl -fsSL "https://get.maestro.mobile.dev" | bash
      
      - name: Build iOS App for Simulator
        run: |
          xcodebuild \
            clean build \
            -workspace ios/MyApp.xcworkspace \
            -scheme MyApp \
            -configuration Release \
            -sdk iphonesimulator \
            -destination "platform=iOS Simulator,name=iPhone 15 Pro" \
            -derivedDataPath ios/build \
            CODE_SIGN_IDENTITY="" \
            CODE_SIGNING_REQUIRED=NO \
            CODE_SIGNING_ALLOWED=NO

      - name: Boot Simulator
        run: |
          xcrun simctl boot "iPhone 15 Pro" || true
          sleep 10

      - name: Install App on Simulator
        run: |
          xcrun simctl install booted ios/build/Build/Products/Release-iphonesimulator/MyApp.app
      
      - name: Run Maestro Tests
        run: maestro test maestro/flows/
        env:
          TEST_EMAIL: ${{ secrets.TEST_EMAIL }}
          TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
      
      - name: Upload Test Results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: maestro-results-${{ matrix.device }}
          path: maestro-results/
          retention-days: 7
      
      - name: Comment on PR
        if: github.event_name == 'pull_request' && failure()
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '❌ Maestro E2E tests failed. Check artifacts for details.'
            })
```

## Jenkins Pipeline

### Jenkinsfile Setup

```groovy
pipeline {
    agent any
    
    environment {
        TEST_EMAIL = credentials('test-email')
        TEST_PASSWORD = credentials('test-password')
        MAESTRO_HOME = "${WORKSPACE}/.maestro"
    }
    
    options {
        timestamps()
        timeout(time: 60, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install') {
            steps {
                sh 'npm ci'
                sh 'curl -fsSL "https://get.maestro.mobile.dev" | bash'
            }
        }
        
        stage('Build') {
            steps {
                sh './gradlew assembleDebug'
            }
        }
        
        stage('Test') {
            steps {
                sh 'maestro test maestro/flows/'
            }
        }
        
        stage('Report') {
            when {
                always()
            }
            steps {
                junit 'maestro-results/**/*.xml'
                publishHTML([
                    reportDir: 'maestro-results',
                    reportFiles: 'report.html',
                    reportName: 'Maestro Report'
                ])
                archiveArtifacts artifacts: 'maestro-results/**', 
                                 allowEmptyArchive: true
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        failure {
            emailext(
                subject: 'Maestro tests failed',
                body: 'Check Jenkins console for details',
                to: 'team@example.com'
            )
        }
    }
}
```

## Parallel Execution

### Multiple Devices

```bash
# Get all devices
DEVICES=$(maestro devices --format json | jq -r '.devices[].id')

# Run on each device in parallel
for device in $DEVICES; do
  maestro test flows/ --device $device &
done

# Wait for all to complete
wait

# Check results
if [ $? -eq 0 ]; then
  echo "✅ All devices passed"
else
  echo "❌ Some devices failed"
fi
```

---

**Version:** 2.x (2.2.0) | **Source:** https://docs.maestro.dev
