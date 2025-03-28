set -e

pushd ./IdentityServer/v5/docs
hugo -d ../../../root/identityserver/v5
popd

pushd ./IdentityServer/v6/docs
hugo -d ../../../root/identityserver/v6
popd

pushd ./IdentityServer/v7/docs
hugo -d ../../../root/identityserver/v7
popd

pushd ./FOSS/
hugo -d ../root/foss
popd

pushd ./BFF/v2/docs
hugo -d ../../../root/bff/v2
popd

pushd ./BFF/v3/docs
hugo -d ../../../root/bff/v3
popd
