pushd "%~dp0"

mkdir node_modules\HtmlRapier
mklink /D node_modules\HtmlRapier\src "%~dp0..\..\src"

popd