#~/usr/bin/env bash
sudo add-apt-repository ppa:git-core/ppa -y
apt-get update
apt-get install -y curl build-essential python-dev libkrb5-dev
apt-get install -y git

# Note the new setup script name for Node.js 
curl -sL https://deb.nodesource.com/setup_5.x | sudo bash -
# Then install with:
sudo apt-get install -y nodejs
