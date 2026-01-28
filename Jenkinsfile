
properties([
    pipelineTriggers([
        [
            $class: 'GenericTrigger',
            token: 'MY_ACCT_TOKEN',
            printContributedVariables: true,
            genericVariables: [
                [key: 'ref',       value: '$.ref'],
                [key: 'repo_name', value: '$.repository.name']
            ],
            regexpFilterText: '$repo_name:$ref',
            regexpFilterExpression: '^.+:refs/heads/.+$' // default to any repo_name and branch in the payload
        ]
    ])
])

pipeline {
    agent any

    tools {
        nodejs 'node18' // Name must match the one you configured in Jenkins
    }
        environment {
        // credentials for git
        GIT_CREDENTIALS = 'Git_Credential'
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
                cleanWs()   // or use deleteDir()
            }
        }
        
        stage('Checkout') {
            steps {

                script {
                    env.branchName = env.ref.replace('refs/heads/', '')
                    echo "Checking out branch: ${env.branchName}"   
                }
                git(
                    branch: env.branchName,
                    credentialsId: "${env.GIT_CREDENTIALS}",
                    url: 'https://github.com/vincentino1/account-service.git'
                )
            }
        }

        stage('Install Dependencies') {
            steps {
                    sh 'npm ci'
            }
        }

        stage('Test') {
            steps {
                    sh 'npm test'
            }
        }

        stage('Build') {
            steps {
                    sh 'npm run build'
            }
        }
    }
}
