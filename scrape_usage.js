const axios = require("axios");
const fs = require("fs");
const { ArgumentParser } = require('argparse');

regional_form_name = (str) => {
    return str
    .replace(/Alola/g,"Alolan")
    .replace(/Galar/g,"Galarian")
    .replace(/Hisui/g,"Hisuian");
}

noBars = (str) => {
    return str.replace(/\|/g, "");
}

const parser = new ArgumentParser({ description: "Smogon usage statistics scraping tool." });
parser.add_argument('-d', '--date', { help: 'Data in YYYY-MM format, example: 2022-01. Required.', required: true });
parser.add_argument('-g', '--gen', { help: 'Pokemon generation number, example: 6. Required.', required: true });
parser.add_argument('-t', '--tier', { help: 'Tier name, example: OU, National Dex. Required.', required: true });
parser.add_argument('-c', '--cutline', { help: 'Usage stats cutline. Must be: 0, 1500, 1630, 1760. Default: 0.', default: 0 });

(async() => { 

    const _date = parser.parse_args()['date'];
    const _gen = "gen" + parseInt(parser.parse_args()['gen']);
    const _tier = (parser.parse_args()['tier']).toLowerCase().replace(/ /g, "");
    const _cutline = parser.parse_args()['cutline'];
    const _scrape = _gen + _tier + "-" + _cutline;

    const _stat = await axios.get('https://www.smogon.com/stats/'+_date+'/moveset/'+_scrape+'.txt');
    const _rank = await axios.get('https://www.smogon.com/stats/'+_date+'/'+_scrape+'.txt');
    
    var pokemonData = {};

    // get ranking/usage data:
    for(let x = 5; x<_rank.data.split("\n").length - 2; x++) { 

        let pokemon = _rank.data.split("\n")[x].split("|");

        let name_reg = /([A-Za-z'-:.]+(?:[A-Za-z\s]+)?(?:[A-Za-z()]+))/;
        let pokemonName = regional_form_name(String(pokemon[2]).match(name_reg)[0]);
        
        let rank = parseInt(pokemon[1]);
        let usage_p = parseFloat(pokemon[3]);
        let usage_r = parseInt(pokemon[4]);

        pokemonData[pokemonName] = { "name": pokemonName, "rank": rank, "usage_percent": usage_p, "usage_raw": usage_r };

    }

    ///////////////////////////////////////////////////////////////////////////////////////////////////////


    const _stat_data = _stat.data.split("+----------------------------------------+ \n +----------------------------------------+");
    const _name_percent_reg = /([A-Za-z'-:.]+(?:[A-Za-z\s]+)?(?:[A-Za-z()]+))([\s]+)([0-9.%]+)/;
    const _name_reg = /([A-Za-z'-:.]+(?:[A-Za-z\s]+)?(?:[A-Za-z()]+))/;

    for(let x = 0; x<_stat_data.length; x++) {

        let pokemon = _stat_data[x].split("+----------------------------------------+ \n");
        
        // Workaround for problem with the way the page is formatted: 
        if(x == 0) pokemon.shift();

        ///////////////////////////////////////////////////////////////////////////////////////////////////////

        let pokemonName = regional_form_name(String(pokemon[0]).match(_name_reg)[0]);

        ///////////////////////////////////////////////////////////////////////////////////////////////////////

        let pokemAbils = {};
        let pokemAbil = noBars(pokemon[2]).split("\n");

        for(let x = 1; x<pokemAbil.length - 1; x++)
            pokemAbils[ String(pokemAbil[x].match(_name_percent_reg)[1]) ] = parseFloat(pokemAbil[x].match(_name_percent_reg)[3]);
        pokemonData[pokemonName]["abilities_percent"] = pokemAbils;

        ///////////////////////////////////////////////////////////////////////////////////////////////////////

        let pokemItems = {};
        let pokemItem = noBars(pokemon[3]).split("\n");

        for(let x = 1; x<pokemItem.length - 1; x++)
            pokemItems[ String(pokemItem[x].match(_name_percent_reg)[1]) ] = parseFloat(pokemItem[x].match(_name_percent_reg)[3]);
        pokemonData[pokemonName]["items_percent"] = pokemItems;

        ///////////////////////////////////////////////////////////////////////////////////////////////////////

        let pokemSpreads = {};
        let pokemSpread = noBars(pokemon[4]).split("\n");

        let spread_reg = /([a-zA-Z:0-9\/]+)([ ]+)([0-9.%]+)/;

        for(let x = 1; x<pokemSpread.length - 1; x++)
            pokemSpreads[ String(pokemSpread[x].match(spread_reg)[1]) ] = parseFloat(pokemSpread[x].match(spread_reg)[3]);
        pokemonData[pokemonName]["stat_spreads"] = pokemSpreads;

        ///////////////////////////////////////////////////////////////////////////////////////////////////////

        let pokemMoves = {};
        let pokemMove = noBars(pokemon[5]).split("\n");

        for(let x = 1; x<pokemMove.length - 1; x++)
            pokemMoves[ String(pokemMove[x].match(_name_percent_reg)[1]) ] = parseFloat(pokemMove[x].match(_name_percent_reg)[3]);
        pokemonData[pokemonName]["common_moves"]= pokemMoves;

        ///////////////////////////////////////////////////////////////////////////////////////////////////////

        let pokemTeams = {};
        let pokemTeam = noBars(pokemon[6]).split("\n");

        for(let x = 1; x<pokemTeam.length - 1; x++) {
            try {
                pokemTeams[ regional_form_name(String(pokemTeam[x].match(_name_percent_reg)[1])) ] = parseFloat(pokemTeam[x].match(_name_percent_reg)[3]);
            } catch(e) { continue };
        }
        pokemonData[pokemonName]["common_teammates"] = pokemTeams;

        ///////////////////////////////////////////////////////////////////////////////////////////////////////

        let pokemCCs = {};
        let pokemCC = noBars(pokemon[7]).split("\n");

        let stat_reg = /\(([0-9.%]+ KOed \/ [0-9.%]+ switched out)\)/;

        for(let x = 1; x<pokemCC.length; x++) {
            if(x % 2 !== 0) continue;
            try {
                pokemCCs[ regional_form_name(String(pokemCC[x-1].match(_name_reg)[1])) ] = String(pokemCC[x].match(stat_reg)[1]);
            } catch(e) { continue };
        }
        pokemonData[pokemonName]["checks_counters"] = pokemCCs;

        ///////////////////////////////////////////////////////////////////////////////////////////////////////

    }

    fs.writeFileSync(_scrape + ".json", JSON.stringify(pokemonData));

})();
