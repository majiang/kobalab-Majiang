#!/bin/sh
set -e

[ $1 ] || (echo "Usage: $0 version"; exit 1)

version=`echo $1 | sed 's/^[^0-9]*//'`

npx semver ${version} || (echo "${version}: bad semver"; exit 1)

ex package.json <<++
    /"version":/s/: .*$/: "${version}",/
    /"build:css":/s/majiang[^ ]*\.css/majiang-${version}.css/
    w!
++

ex package-lock.json <<++
    1,9s/"version":.*,/"version": "${version}",/
    w!
++

ex src/js/majiang.js <<++
    /Majiang v/s/v.*/v${version}/
    /VERSION:/s/'.*'/'${version}'/
    w!
++

echo "- var version = '${version}'" > src/html/version.pug
