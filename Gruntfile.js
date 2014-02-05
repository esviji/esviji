module.exports = function(grunt) {

  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-contrib-less");
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-manifest");
  grunt.loadNpmTasks("grunt-autoprefixer");
  grunt.loadNpmTasks("grunt-growl");

  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),

    watch: {
      less: {
        options: {
          debounceDelay: 250
        },
        files: "src/less/*.less",
        tasks: ["growl:less", "less", "growl:autoprefixer", "autoprefixer"]
      },
      js: {
        options: {
          debounceDelay: 250
        },
        files: "src/js/*.js",
        tasks: ["growl:js", "jshint"]
      },
      manifest: {
        options: {
          debounceDelay: 250
        },
        files: ["src/index.html", "src/css/**", "src/js/**", "src/img/**", "src/sounds/**"],
        tasks: ["growl:manifest", "manifest:src"]
      }
    },

    jshint: {
      all: ['Gruntfile.js', 'src/js/*.js']
    },

    growl: {
      less: {
        title : "Grunt",
        message : "LESS compilation…"
      },
      autoprefixer: {
        title : "Grunt",
        message : "autoprefixer…"
      },
      js: {
        title : "Grunt",
        message : "JS hint…"
      },
      manifest: {
        title : "Grunt",
        message : "Updating manifest.appcache…"
      }
    },

    less: {
      src: {
        files: {
          "src/css/styles.css": "src/less/styles.less"
        }
      }
    },

    autoprefixer: {
      options: {
        browsers: ["> 1%", "last 2 versions", "android >= 2"]
      },
      no_dest: {
        src: "src/css/styles.css"
      }
    },

    clean: {
      dist: {
        src: "dist/"
      }
    },

    copy: {
      dist: {
        files: [
          {
            expand: true,
            cwd: "src/",
            src: ["index.html", ".htaccess", "manifest.webapp", "css/font/*", "sounds/sprite.{mp3,ogg}"],
            dest: "dist/"
          },
          {
            expand: true,
            cwd: "src/favicons/",
            src: "*",
            dest: "dist/"
          }
        ]
      }
    },

    modernizr: {
      "devFile" : "src/js/vendor/modernizr-*.js",
      "outputFile" : "build/modernizr-custom.js",
      "extra" : {
        "shiv" : true,
        "printshiv" : false,
        "load" : true,
        "mq" : false,
        "cssclasses" : true
      },
      "uglify" : false
    },

    useminPrepare: {
      options: {
        dest: "dist/"
      },
      html: "src/index.html"
    },
    usemin: {
      html: "dist/index.html"
    },

    concat: {
      options: {
        separator: ";"
      }
    },

    removelogging: {
      dist: {
        src: "dist/js/app.js",
        options: {}
      }
    },

    uglify: {
      options: {
        banner: "/*! <%= pkg.name %> v<%= pkg.version %> - <%= grunt.template.today('yyyy-mm-dd') %> - Copyright (c) 1992-<%= grunt.template.today('yyyy') %> Nicolas Hoizey <nicolas@hoizey.com> */",
        report:"min"
      }
    },

    cssmin: {
      options: {
        banner: "/*! <%= pkg.name %> v<%= pkg.version %> - <%= grunt.template.today('yyyy-mm-dd') %> - Copyright (c) 1992-<%= grunt.template.today('yyyy') %> Nicolas Hoizey <nicolas@hoizey.com> */"
      }
    },

    rev: {
      options: {
        encoding: "utf8",
        algorithm: "md5",
        length: 8
      },
      assets: {
        files: [{
          src: [
            "dist/css/styles.css",
            "dist/js/app.js"
          ]
        }]
      }
    },

    manifest: {
      src: {
        options: {
          basePath: "src/",
          network: ["*"],
          verbose: true,
          timestamp: true
        },
        src: [
          "js/**/*.js",
          "css/styles.css",
          "css/font/*",
          "sounds/*.{ogg,mp3}"
        ],
        dest: "src/manifest.appcache"
      },
      dist: {
        options: {
          basePath: "dist/",
          network: ["*"],
          verbose: true,
          timestamp: true
        },
        src: [
          "js/*.js",
          "css/*.css",
          "css/font/*",
          "sounds/*.{ogg,mp3}"
        ],
        dest: "dist/manifest.appcache"
      }
    },

    sed: {
      version: {
        path: "dist/",
        recursive: true,
        pattern: "%VERSION%",
        replacement: "<%= pkg.version %>"
      },
      favicons: {
        path: "dist/index.html",
        pattern: "/favicons",
        replacement: ""
      }
    },

    docco: {
      debug: {
        src: ["src/js/esviji.js"],
        options: {
          output: "docs/"
        }
      }
    }
  });

  grunt.registerTask("default", ["compile", "watch"]);
  grunt.registerTask("compile", ["growl:less", "less", "growl:autoprefixer", "autoprefixer", "growl:manifest", "manifest:src"]);
  grunt.registerTask("package", [], function() {
    // cf https://github.com/gruntjs/grunt/issues/975#issuecomment-29058707
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-copy");
//    grunt.loadNpmTasks("grunt-modernizr");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-remove-logging");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-cssmin");
    grunt.loadNpmTasks("grunt-usemin");
    grunt.loadNpmTasks("grunt-rev");
    grunt.loadNpmTasks("grunt-sed");
    grunt.loadNpmTasks("grunt-docco");
    grunt.task.run("less", "autoprefixer", "clean", "copy", /*"modernizr",*/ "useminPrepare", "concat", "removelogging", "uglify", "cssmin", "rev", "usemin", "sed", "manifest:dist", "docco");
  });
};
