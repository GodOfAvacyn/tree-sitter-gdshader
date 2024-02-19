### Introduction
This is a tree-sitter grammar for the Godot shading language GDShader. This allows for syntax highlighting in text editors outside of Godot's own text editor (most notably, for Neovim). I wrote this in conjunction with the [gdshader-lsp](), which allows for more advanced things like error messages and code completion.

### Usage
This tree-sitter grammar is not yet automatically availabe in any editors. Until I figure out how to get in contact with the nvim-treesitter maintaier, I will go over steps to setting it up inside of Neovim manually. 
1. Clone this repo.
2. Add the following somewhere in your neovim configuration (this requires [nvim-treesitter]()):
   ```
   local parser_config = require "nvim-treesitter.parsers".get_parser_configs()
   parser_config.gdshader = {
       install_info = {
           url = "<path to the treesitter directory>",
           files = {"src/parser.c"},
       },
       filetype = "gdshader"
   }

   ```
3. Inside a 'queries' folder located at the top level of your nvim config directory, add a new folder called 'gdshader'.
4. Copy the 'highlights.scm' file located the 'queries' directory in the repo into your newly created folder described above.
