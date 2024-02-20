[
  "render_mode"
  "shader_type"
  "group_uniforms"
  "global"
  "instance"
  "const"
  "varying"
  "uniform"
  "struct"
  "for"
  "in"
  "out"
  "inout"
  "while"
  "do"
  "switch"
  "case"
  "default"
  "if"
  "else"
  "elif"
  "continue"
  "break"
  "return"
  "include"
  "#"
  (precision_qualifier)
  (interpolation_qualifier)
] @keyword

(string) @string

[
  "="
  "+="
  "-="
  "!"
  "~"
  "+" 
  "-"
  "*"
  "/"
  "%"
  "||"
  "&&"
  "|"
  "^"
  "&"
  "=="
  "!="
  ">"
  ">="
  "<="
  "<"
  "<<"
  ">>"
  "++"
  "--"
] @operator

[
  (boolean)
  (integer)
  (float)
] @number

[
  "."
  ","
  ";" 
  "(" 
  ")" 
  "[" 
  "]" 
  "{" 
  "}" 
] @punctuation

[
  (builtin_type)
] @type

(ident_type) @type.definition

[
  (shader_type)
  (render_mode)
  (hint_name)
] @property

(ident) @identifier

(builtin_variable) @constant
(builtin_function) @function

(group_uniforms_declaration
  group_name: (ident) @property
  subgroup_name: (ident) @property)

(struct_declaration
  name: (ident) @type)
(struct_member
  name: (ident) @property)
(function_declaration
  name: (ident) @function)
(parameter
  name: (ident) @parameter)
(member_expr
  member: (ident) @property) 
(call_expr
  function: [
    (ident)
    (builtin_type)] @function)
(call_expr
  function: (builtin_type) @function)

(comment) @comment

