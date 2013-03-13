var gpg = require('../lib/gpg');
var should = require('should');

var key = [
        '-----BEGIN PGP PRIVATE KEY BLOCK-----',
        'Version: GnuPG v1.4.10 (GNU/Linux)',
        '',
        'lQO+BE3ubjIBCACkvogvZHAouDPog1pOgxKHtjj2N2A+4eDXHSUEQ6A7BasZB3tX',
        'ucc18BAeYdCWWYh8heOyUNdymdibv2ymuqE1NFdX83OjTiPtShrJRqc2pSujDCts',
        'Oy002pNxsP+zpw+DThSwerotpBPJmuG4efIqZF7jn0tHvPFFerGOfzD1c0YxXx6T',
        'fAfwi77ekXIwaLYPFaiBBDtqjDSrdReU/GR6c6rInXotEB6NhowQPT5iaAlYMhKt',
        'YRN0eUA3K9t5lpoQS1P0vMlnpCYfdqkgeyaxs3jyudK9cEWSvM7FeOTZPfs39hDt',
        'R+xIVKgFNkpyQLF1XYmXyzTy60UZGBNOAp4XABEBAAH+AwMCBY46XHt5aX1gjeOT',
        'oSMeqG5GFJ6jrXr0o5Q7OYAFxyOOElZ9gDtRgExe/H6s9Oq/k+vVlL6hifA3BxVy',
        '+mrQJKYofkKv/E8UBoK+2xkDTzyuv17WqU3ZsMcDmnHjt+Qbtmn821fqg6Fh505M',
        'UkNjibIFH95/1hgbjeG+0ba8wHZoT3Amh6jBJfyfF3ARTq0zYRAoQPdI5fMxbs2+',
        'lJJyA5/x9gGCEK5lFHCdOIzPpZQHUupHU3x0y0j1d10pnDCekqTUqR8hMqGep+Yq',
        'GzBUxOhv29Ce0K9+Ylo2IaZlyjqpoRhz3OffPog0Zw+CmrYfAPx/NTv2WfjX9RTl',
        'tx/I8iDykc1ZiiyVpfpdwezyAU7F47Ers+iVQ0Fx1XVs+iRI2lfINmhRoEE5Uxeo',
        'raHCJqb3Djm8w3MSKRuaPcCTZY8ht0vNFlnYsR/C+gM/DOLgDkPOhPfZEK9EJMiW',
        '278aLr7MlF3mkRjkqbwyIV9Dcacrlt9CgLI5anCXXiSyLHQdVf93SoMBqrHlzumr',
        'ozoi23PwuxSA6XVTNJl+zSMqhmCCugEL3/2CBU3cYKdQEUtk7qcriT+WUaIPRuhh',
        'M+ns4MWmAU9klZZr8FadWF1VcLn1kIs6LIlOmww5Q9hjZOeKozqwKC34S6/w83Ki',
        'nfyDomNV8lXvsgIhT9zK1DoCx/9RmEsFDDxzGWFbfyfRfFA6IBrMA523uJjvASpa',
        'q0K4iWY1cQ+EMHe03zzJQazTLQop6X82ONMMIr2zYZN2r3v5aW/NRe1N7pYPk2B9',
        'VR/Ug1J23S74LDiWLds4+AOIW7dH80eQKgClFRIiF5YH9sbqGsjXohQ8U3kEl6KX',
        'xDmzJKDdYnKpJVeSVVsoCS8M51G/2mEXqmcAjYyQe6bggoPQ3G2bObRC/AKSc6h9',
        'XrQ3UGF1bCBTY2hvb3NzIChJbnRlcm5hbCBSZXBvIGZvciBMRikgPFBhdWxAbGl2',
        'ZWZ5cmUuY29tPokBOAQTAQIAIgUCTe5uMgIbAwYLCQgHAwIGFQgCCQoLBBYCAwEC',
        'HgECF4AACgkQqswI2hfV9ybIsAf8CtFK4cOR9cWuYj+BY9Ohu6iFh6snrSL173fN',
        'ir7ha4m9q9H3y4OITzOxS6wgPJlfhf5I4T3FPjcbv6TySQgRym7h08740CpK4wTC',
        'v0OG4JEoaa9oY0aRzlkOMMx7KUVJcrPPhGRzJSFAGRUdrfDTixhgnXr1zT6mU0XV',
        'Qn97JYyepdFNWw1EnwNtJM1GqIYMJXScvKwsb5iwbXyuJ29IshpDJH37fI1ZYlKi',
        '0erQaC1KKhFvFvs2AsSAUqrzK4xDAS0IIe7s4yVn7Y5ibwQAdmsCQLn3CwCWnE6s',
        'XRK0cb4qoYWPpkDWlFgThaZ5momjGdK9128LzJzUUykx4HAWoA==',
        '=Qf4x',
        '-----END PGP PRIVATE KEY BLOCK-----'
    ].join('\n');
    
var password = "LivefyreFTW2011"

module.exports = {

  'test .sign()': function(done) {
    gpg.sign(key, password, "data", function(data) {
        var prefix = '-----BEGIN PGP SIGNATURE-----\n'
        var suffix = '\n-----END PGP SIGNATURE-----\n';
        
        data.indexOf(prefix).should.equal(0);
        data.indexOf(suffix).should.equal(data.length - suffix.length);
        
	    done();
    });
  }
};
