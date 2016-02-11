#!/usr/bin/env bash


run_tests=false
gen_minified=false
gen_docs=false

while getopts ":amdt" opt; do
    case $opt in
        a)
            run_tests=true
            gen_minified=true
            gen_docs=true
            ;;
        m)
            gen_minified=true
            ;;
        d)
            gen_docs=true
            ;;
        t)
            run_tests=true
            ;;
        \?)
            echo "Invalid option: -$OPTARG" >&2
            ;;
    esac
done

if [ $run_tests == true ]; then
    vows=./node_modules/vows/bin/vows

    # Run tests
    $vows ./tests/*

    # Exit early if the tests failed
    if [ $? -ne 0 ]; then
        echo ""
        echo "Tests failed, exiting early."
        exit 1
    fi

    echo ""
fi

if [ $gen_minified == true ]; then
    # Build minified script
    java -jar ./build/compiler.jar --js=./src/keys.js --js_output_file=./src/keys.min.js
    echo "Minified script output to src/keys.min.js."
fi

if [ $gen_docs == true ]; then
    # Regenerate Documentation
    jsdoc=./node_modules/.bin/jsdoc
    $jsdoc -c ./conf.json
    echo "Documentation rebuilt."
fi
