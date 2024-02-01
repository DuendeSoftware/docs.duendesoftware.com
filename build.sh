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