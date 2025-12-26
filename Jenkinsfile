pipeline {
    agent any

    environment {
        // CI/CD Config
        REGISTRY = 'ghcr.io'
        IMAGE_NAME = 'fooddelivery-backend'
        
        // AWS / EC2 Config (Configure these as 'Secret Text' in Jenkins Credentials)
        EC2_HOST = credentials('EC2_HOST')
        EC2_USER = credentials('EC2_USER')
        
        // App Secrets (Configure these as 'Secret Text' or 'String' in Jenkins Credentials)
        MONGO_URI = credentials('MONGO_URI')
        JWT_SECRET = credentials('JWT_SECRET')
        FRONTEND_URL = credentials('FRONTEND_URL')
        
        // Email Secrets
        EMAIL_SERVICE = credentials('EMAIL_SERVICE')
        EMAIL_USER = credentials('EMAIL_USER')
        EMAIL_PASS = credentials('EMAIL_PASS')
        
        // AWS S3/CloudFront Secrets
        AWS_REGION = credentials('AWS_REGION')
        AWS_BUCKET_NAME = credentials('AWS_BUCKET_NAME')
        AWS_ACCESS_KEY_ID = credentials('AWS_ACCESS_KEY_ID')
        AWS_SECRET_ACCESS_KEY = credentials('AWS_SECRET_ACCESS_KEY')
        AWS_FRONTEND_BUCKET_NAME = credentials('AWS_FRONTEND_BUCKET_NAME')
        CLOUDFRONT_DISTRIBUTION_ID = credentials('CLOUDFRONT_DISTRIBUTION_ID')
        
        // Credentials IDs
        GITHUB_CREDS_ID = 'github-token' // Username/Password (Token) for GHCR
        SSH_KEY_ID = 'ec2-ssh-key'       // SSH Private Key for EC2
        
        // Credentials for Remote Login
        GITHUB_USER_VAL = credentials('github-username') // You need to add this
        GITHUB_TOKEN_VAL = credentials('github-token-secret') // You need to add this
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build & Push Backend') {
            steps {
                script {
                    dir('backend') {
                        // Login to GitHub Container Registry
                        withDockerRegistry(credentialsId: GITHUB_CREDS_ID, url: "https://${REGISTRY}") {
                            // Helper to get repo owner in lowercase
                            def repoOwner = env.GIT_URL.split('/')[-2].toLowerCase() 
                            def imageTag = "${REGISTRY}/${repoOwner}/${IMAGE_NAME}:latest"
                            
                            sh "docker build -t ${imageTag} ."
                            sh "docker push ${imageTag}"
                        }
                    }
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                    // VITE_API_URL is baked into the build
                    sh 'VITE_API_URL=/api npm run build'
                }
            }
        }

        stage('Deploy to EC2') {
            steps {
                sshagent([SSH_KEY_ID]) {
                    sh """
                        # Create app directory if not exists
                        ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} 'mkdir -p ~/app'
                        
                        # Copy docker-compose
                        scp -o StrictHostKeyChecking=no docker-compose.yml ${EC2_USER}@${EC2_HOST}:~/app/docker-compose.yml
                        
                        # Execute Remote Deployment Script
                        ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} """
                            set -e
                            cd ~/app
                            
                            # LOGIN TO GHCR (REQUIRED)
                            echo "${GITHUB_TOKEN_VAL}" | sudo docker login ghcr.io -u ${GITHUB_USER_VAL} --password-stdin


                            # 1. Install Docker/Compose if missing (Simplified for brevity, assumes standard deployment)
                            if ! command -v docker &> /dev/null; then
                                echo "Installing Docker..."
                                sudo yum update -y && sudo yum install -y docker
                                sudo service docker start
                                sudo usermod -aG docker ${EC2_USER}
                            fi
                            if ! command -v docker-compose &> /dev/null; then
                                echo "Installing Docker Compose..."
                                sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)" -o /usr/local/bin/docker-compose
                                sudo chmod +x /usr/local/bin/docker-compose
                                sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose || true
                            fi

                            # 2. Fix ELK Memory (Max Map Count)
                            sudo sysctl -w vm.max_map_count=262144

                            # 3. Create .env file dynamically
                            cat > .env <<ENV
NODE_ENV=production
PORT=8000
MONGO_URI=${MONGO_URI}
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRE=30d
FRONTEND_URL=${FRONTEND_URL}
EMAIL_SERVICE=${EMAIL_SERVICE}
EMAIL_USER=${EMAIL_USER}
EMAIL_PASS=${EMAIL_PASS}
AWS_REGION=${AWS_REGION}
AWS_BUCKET_NAME=${AWS_BUCKET_NAME}
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
ENV

                            # 4. Login to GHCR (requires passing creds safely, skipping valid login for public read or authenticated pull logic required)
                            # Note: For private images, you need to docker login on the server. 
                            # Simplest way: Pass the token via secret text variable "GITHUB_TOKEN" if needed.

                            # 5. Deploy
                            sudo docker-compose pull
                            sudo docker-compose up -d --force-recreate --remove-orphans
                            sudo docker image prune -f
                        """"""
                }
            }
        }

        stage('Deploy Frontend to S3') {
            steps {
                sshagent([SSH_KEY_ID]) {
                    sh """
                        # Prepare Remote Directory
                        ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} 'mkdir -p ~/frontend-deploy-temp'
                        
                        # Copy Build Artifacts
                        scp -o StrictHostKeyChecking=no -r frontend/dist ${EC2_USER}@${EC2_HOST}:~/frontend-deploy-temp/dist
                        
                        # Sync to S3 & Invalidate CloudFront
                        ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} 'bash -s' << 'EOF'
                            set -e
                            
                            # Ensure AWS CLI
                            if ! command -v aws &> /dev/null; then
                                sudo yum install -y aws-cli || sudo apt-get install -y awscli
                            fi

                            # Sync to S3
                            echo "Syncing to S3..."
                            aws s3 sync ~/frontend-deploy-temp/dist s3://${AWS_FRONTEND_BUCKET_NAME}

                            # Invalidate Cache
                            if [ ! -z "${CLOUDFRONT_DISTRIBUTION_ID}" ]; then
                                echo "Invalidating CloudFront..."
                                aws cloudfront create-invalidation --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID} --paths "/*"
                            fi

                            # Cleanup
                            rm -rf ~/frontend-deploy-temp
                        EOF
                    """
                }
            }
        }
    }
}
