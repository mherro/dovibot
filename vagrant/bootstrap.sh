#
:wq!/usr/bin/env bash
sudo add-apt-repository ppa:git-core/ppa -y
apt-get update
apt-get install -y curl build-essential python-dev libkrb5-dev
apt-get install -y git

# Note the new setup script name for Node.js 
curl -sL https://deb.nodesource.com/setup_5.x | sudo bash -
# Then install with:
sudo apt-get install -y nodejs



mkdir /opt/redis
mkdir /opt/redis/bin
cd /opt/redis

wget http://download.redis.io/redis-stable.tar.gz
tar xvzf redis-stable.tar.gz
cd redis-stable

make

cp src/redis-server /opt/redis/bin/redis-server
cp src/redis-cli /opt/redis/bin/redis-cli

cp /vagrant/vagrant/redis.init.d /etc/init.d/redis
cp /vagrant/vagrant/redis.conf /etc/redis.conf

mkdir /var/redis
chmod -R 777 /var/redis

useradd redis

sudo touch /var/log/redis.log
sudo chown redis /var/log/redis.log
sudo chgrp redis /var/log/redis.log

chmod 755 /etc/init.d/redis
/etc/init.d/redis start
