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

# Using the Form Builder
Versions of HtmlRapier before version 19 had a built in default form that used styles from bootstrap 3. Newer versions
remove this default form, since we don't actually have any dependency on bootstrap 3 other than the form. There is no 
simplified default form included, so if you are trying this library out please include htmlrapier.form.bootstrap3 or
htmlrapier.form.bootstrap4 in your dependencies. This will copy a file named defaultform.js to `/lib/htmlrapier.form/defaultform.js`
in your project. Be sure to include that file on your page before you include hr-run.js to make sure the form is loaded before
you try to use it.