#!/bin/bash

# make sure node is installed
if ! command -v node;then
	echo "Install node and npm first then re-run script"
	echo "Go to https://nodejs.org/en/download/ to download and install"
	exit
fi

# clone and install
git clone https://github.com/elmsln/hax11ty.git

cd hax11ty/
# install
npm install
