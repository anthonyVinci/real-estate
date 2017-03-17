//importing modules
var express = require( 'express' );
var request = require( 'request' );
var cheerio = require( 'cheerio' );

var app = express();
app.set( 'view engine', 'ejs' );

app.use( '/assets', express.static( 'assets' ) );


app.get( '/',
    function ( req, res ) {
        var URL = req.query.urlLBC
        if ( URL ) {
            callLBC( URL, res )
        }
        else {
            res.render( 'home', {
                message: '',
                prix: "",
                type: "",
                surface: "",
                ville: "",
                cp: "",
                prixAuMetreCarre: "",
            });
        }
    }
);


//launch the server on the 3000 port
app.listen( 3000, function () { console.log( 'App listening on port 3000!' ); });

function callLBC( _url, res ) {
    request( _url, function ( error, response, body ) {
        if ( !error && response.statusCode == 200 ) {
            var url = cheerio.load( body )
            var info = url( 'span.value' )

            var price = info.eq( 0 ).text().replace( '€', '' )
            price = price.replace( / /g, "" )

            var nomVille = info.eq( 1 ).text().split( ' ' )[0]

            var codePostal = info.eq( 1 ).text().split( ' ' )[1]

            var typeDeBien = info.eq( 2 ).text()

            var surface = info.eq( 4 ).text().split( ' ' )[0]

            var prixAuMetreCarre = price / surface
            prixAuMetreCarre = prixAuMetreCarre.toFixed( 2 )



            request( 'http://www.meilleursagents.com/prix-immobilier/' + nomVille.toLowerCase() + '-' + codePostal, function ( error, response, body ) {
                if ( !error && response.statusCode == 200 ) {
                    var url2 = cheerio.load( body )
                    var prixMoyenAppartement = url2( 'div.small-4.medium-2.columns.prices-summary__cell--median' ).eq( 0 ).text().replace( '€', '' ).replace( /\s/g, '' )
                    prixMoyenAppartement = parseFloat( prixMoyenAppartement )
                    var prixMoyenMaison = url2( 'div.small-4.medium-2.columns.prices-summary__cell--median' ).eq( 1 ).text().replace( '€', '' ).replace( /\s/g, '' )
                    var message = ''
                    if ( typeDeBien == 'Appartement' ) {
                        if ( prixMoyenAppartement > prixAuMetreCarre ) {
                            message = 'Bon deal, le prix au mètre carré de cet appartement (' + prixAuMetreCarre + ' €) est inférieur au prix moyen du mètre carré de la région (' + prixMoyenAppartement + '€)'
                        }
                        else {
                            message = 'Mauvais deal, le prix au mètre carré de cet appartement (' + prixAuMetreCarre + ' €) est supérieur au prix moyen du mètre carré de la région (' + prixMoyenAppartement + '€)'
                        }
                    }
                    else {
                        if ( prixMoyenMaison > prixAuMetreCarre ) {
                            message = 'Bon deal, le prix au mètre carré de cette maison (' + prixAuMetreCarre + ' €) est inférieur au prix moyen du mètre carré de la région (' + prixMoyenMaison + '€)'
                        }
                        else {
                            message = 'Mauvais deal, le prix au mètre carré de cette maison (' + prixAuMetreCarre + ' €) est supérieur au prix moyen du mètre carré de la région(' + prixMoyenMaison + '€)'
                        }

                    }

                    res.render( 'home', {
                        prix: price,
                        type: typeDeBien,
                        surface: surface,
                        ville: nomVille,
                        cp: codePostal,
                        prixAuMetreCarre: prixAuMetreCarre,
                        message: message
                    });
                }
            })
        }
    })
}
