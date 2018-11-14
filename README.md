# HtmlRapier
A tiny mvc library for building web apps using rest apis.

Visit https://threax.github.io/HtmlRapierDocs/ for more information.

# Testing
To run the tests yarn link this library into a hypermedia project.

Add the following to artifacts.json:

  {
    "pathBase": "./node_modules/htmlrapier/testPages",
    "outDir": "test/htmlrapier",
    "copy": [
      "./node_modules/htmlrapier/testPages/*"
    ]
  }

And the following to tsconfig.json:

under "paths"

"hr.test.*": [
    "node_modules\\htmlrapier\\test\\*"
],

under "include"

"node_modules\\htmlrapier\\test\\**\\*.ts",

visit https://projecturl/test/htmlrapier/unittests.html to test.

# Building Components from HTML
You can use the htmlrapier-compile project to build typescript component definitions from html files.

Once you compile the html template to typescript compile it with the typescript compiler to produce a js file. Include a runner typescript file that will run the form
module so it gets registered.

The artifacts will contain the default form.

Inside your application be sure to include a form before calling the hr-run.js file.