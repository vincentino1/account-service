properties([
    pipelineTriggers([
        [
            $class: 'GenericTrigger',
            token: 'MY_ACCT_TOKEN',
            printContributedVariables: true,
            genericVariables: [
                [key: 'ref', value: '$.ref'],
                [key: 'repo_name', value: '$.repository.name']
            ],
            regexpFilterText: '$repo_name:$ref',
            regexpFilterExpression: '^.+:refs/heads/.+$'
        ]
    ])
])

pipeline {
    agent any

    tools {
        nodejs 'node18' // Must match your Jenkins NodeJS tool
    }

    environment {
        // Git
        GIT_CREDENTIALS = 'github-creds'

        // Nexus Docker Registry
        DOCKER_REPO           = 'myapp-docker-hosted'
        REGISTRY_HOSTNAME     = '3-98-125-121.sslip.io' 
        REVERSE_PROXY_BASE_URL = 'https://3-98-125-121.sslip.io'
        DOCKER_CREDENTIALS_ID = 'docker-registry-creds'
    }

    stages {

        stage('Webhook Debug') {
            steps {
                echo "Branch: ${env.ref}" 
                echo "Repo: ${env.repo_name}"
            }
        }

        stage('Clean Workspace') {
            steps {
                echo "Deleting workspace..."
                cleanWs()
            }
        }

        stage('Checkout') {
            steps {
                script {
                    if (!env.ref) {
                        error "Webhook did not provide 'ref'. Cannot determine branch."
                    }
                    env.branchName = env.ref.replace('refs/heads/', '')
                    echo "Checking out branch: ${env.branchName}"
                }

                git(
                    branch: "${env.branchName}",
                    credentialsId: "${env.GIT_CREDENTIALS}",
                    url: 'https://github.com/vincentino1/account-service.git'
                )
            }
        }

        stage('Install Dependencies') {
            steps {
                withCredentials([
                    string(credentialsId: 'NEXUS_NPM_TOKEN', variable: 'NEXUS_NPM_TOKEN')
                ]) {
                    writeFile file: '.npmrc', text: """
registry=https://16-52-79-103.sslip.io/repository/myapp-npm-group/
always-auth=true
//16-52-79-103.sslip.io/repository/myapp-npm-group/:_auth=\${NEXUS_NPM_TOKEN}
"""
                    sh 'npm ci'
                    sh 'npm whoami'
                }
            }
            post {
                always { sh 'rm -f .npmrc' }
            }
        }

        stage('Unit Tests') {
            steps {
                sh 'npm run test'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Publish NPM Package') {
            when { expression { env.branchName == 'main' } }
            steps {
                withCredentials([
                    string(credentialsId: 'NEXUS_NPM_TOKEN', variable: 'NEXUS_NPM_TOKEN')
                ]) {
                    writeFile file: '.npmrc', text: """
registry=https://16-52-79-103.sslip.io/repository/myapp-npm-hosted/
always-auth=true
//16-52-79-103.sslip.io/repository/myapp-npm-hosted/:_auth=\${NEXUS_NPM_TOKEN}
email=myapp-developer@test.com
"""
                    sh 'npm publish'
                }
            }
            post {
                always { sh 'rm -f .npmrc' }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    def pkg = readJSON file: 'package.json'
                    def appName = pkg.name

                    env.IMAGE_NAME = "${REGISTRY_HOSTNAME}/${DOCKER_REPO}/${appName}:v${BUILD_NUMBER}"

                    docker.withRegistry("${REVERSE_PROXY_BASE_URL}", "${DOCKER_CREDENTIALS_ID}") {
                        docker.build(env.IMAGE_NAME)
                    }

                    echo "Built image: ${env.IMAGE_NAME}"
                }
            }
        }

        stage('Push Docker Image to Nexus') {
            when { expression { env.branchName == 'main' } }
            steps {
                script {
                    docker.withRegistry("${REVERSE_PROXY_BASE_URL}", "${DOCKER_CREDENTIALS_ID}") {
                        docker.image(env.IMAGE_NAME).push()
                    }
                    echo "Pushed Docker image: ${env.IMAGE_NAME}"
                }
            }
        }
    }

    post {
        always {
            sh 'docker rmi ${IMAGE_NAME} || true' // Cleanup
        }
        success {
            echo 'Pipeline completed successfully.'
        }
        failure {
            echo 'The pipeline encountered an error and did not complete successfully.'
        }
    }
}




// properties([
//     pipelineTriggers([
//         [
//             $class: 'GenericTrigger',
//             token: 'MY_ACCT_TOKEN',
//             printContributedVariables: true,
//             genericVariables: [
//                 [key: 'ref', value: '$.ref'],
//                 [key: 'repo_name', value: '$.repository.name']
//             ],
//             regexpFilterText: '$repo_name:$ref',
//             regexpFilterExpression: '^.+:refs/heads/.+$'
//         ]
//     ])
// ])

// pipeline {
//     agent any

//     tools {
//         nodejs 'node18' // Name must match the one you configured in Jenkins
//     }

//     environment {
//         GIT_CREDENTIALS       = 'github-creds'

//         // Nexus Docker Registry ENV
//         DOCKER_REPO           = 'myapp-docker-hosted'
//         REGISTRY_HOSTNAME     = '3-98-125-121.sslip.io'
//         REVERSE_PROXY_BASE_URL = 'https://3-98-125-121.sslip.io'

//         // Docker credentials ID (must be Username/Password type in Jenkins)
//         DOCKER_CREDENTIALS_ID = 'docker-registry-creds'
//     }

//     stages {

//         stage('Webhook Debug') {
//             steps {
//                 echo "Branch: ${env.ref}"
//                 echo "Repo: ${env.repo_name}"
//             }
//         }

//         stage('Clean Workspace') {
//             steps {
//                 echo "Deleting workspace..."
//                 cleanWs()
//             }
//         }

//         stage('Checkout') {
//             steps {
//                 script {

//                     if (!env.ref) {
//                         error "Webhook did not provide 'ref'. Cannot determine branch."
//                     }

//                     env.branchName = env.ref.replace('refs/heads/', '')
//                     echo "Checking out branch: ${env.branchName}"
//                 }

//                 git(
//                     branch: "${env.branchName}",
//                     credentialsId: "${env.GIT_CREDENTIALS}",
//                     url: 'https://github.com/vincentino1/account-service.git'
//                 )
//             }
//         }

//         stage('Install Dependencies') {
//             steps {
//                     withCredentials([
//                         string(credentialsId: 'NEXUS_NPM_TOKEN', variable: 'NEXUS_NPM_TOKEN')
//                     ]) {
//                         writeFile file: '.npmrc', text: """
// registry=https://16-52-79-103.sslip.io/repository/myapp-npm-group/
// always-auth=true
// //16-52-79-103.sslip.io/repository/myapp-npm-group/:_auth=\${NEXUS_NPM_TOKEN}
// """
//                         sh 'npm ci'
//                         sh 'npm whoami'
//                     }
//             }

//             post {
//                 always { sh 'rm -f .npmrc'}
//             }
//         }
























//         stage('Unit Tests') {
//             steps {
//                     sh 'npm run test'
//             }
//         }

//         stage('Build') {
//             steps {
//                     sh 'npm run build'
//             }
//         }

//         stage('Publish NPM Package') {
//             when { expression { return env.branchName == 'main'}}
            
//             steps {
//                     withCredentials([
//                         string(credentialsId: 'NEXUS_NPM_TOKEN', variable: 'NEXUS_NPM_TOKEN')
//                     ]) {
//                         writeFile file: '.npmrc', text: """
// registry=https://16-52-79-103.sslip.io/repository/myapp-npm-hosted/
// always-auth=true
// //16-52-79-103.sslip.io/repository/myapp-npm-hosted/:_auth=\${NEXUS_NPM_TOKEN}
// email=myapp-developer@test.com
// """
//                         sh 'npm publish'
//                     }
//             }

//             post {
//                 always { sh 'rm -f .npmrc'}
//             }
//         }

//         stage('Build Docker Image') {
//             steps {
//                     script {

//                         def pkg = readJSON file: 'package.json'
//                         def appName = pkg.name

//                         env.IMAGE_NAME = "${REGISTRY_HOSTNAME}/${DOCKER_REPO}/${appName}:v${BUILD_NUMBER}"

//                         docker.withRegistry("${REVERSE_PROXY_BASE_URL}", "${DOCKER_CREDENTIALS_ID}") {
//                             docker.build(env.IMAGE_NAME)
//                         }

//                         echo "Built image: ${env.IMAGE_NAME}"
//             }
//         }

//         stage('Push Docker Image to Nexus') {
//             when { 
//                 expression { return env.branchName == 'main'}
//             }
//             steps {
//                 script {
//                     docker.withRegistry("${REVERSE_PROXY_BASE_URL}", "${DOCKER_CREDENTIALS_ID}") {
//                         docker.image(env.IMAGE_NAME).push()
//                     }

//                     echo "Pushed Docker image: ${env.IMAGE_NAME}"

//                 }
//             }
//         }
//     }

//     post {
//         always {
//             sh 'docker rmi ${IMAGE_NAME} || true'  // Cleanup
//         }
//         success {
//             echo 'Pipeline completed successfully.'
//         }
//         failure {
//             echo 'The pipeline encountered an error and did not complete successfully.'
//         }
//     }
// }
