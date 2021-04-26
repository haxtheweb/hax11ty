#!/bin/bash

# make sure node is installed
if ! command -v node;then
	echo "Install node and npm first then re-run script"
	echo "Go to https://nodejs.org/en/download/ to download and install"
	exit
fi

# if yarn isn't installed install it
if ! command -v yarn;then
	npm -g install yarn
fi

# clone and install
git clone https://github.com/elmsln/hax11ty.git

cd hax11ty/

yarn install