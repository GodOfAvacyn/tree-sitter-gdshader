const PREC = {
    PARENTHESIS: -5,
    ASSIGNMENT: -4,
    IDENT_TYPE: -3,
    ARRAY_TYPE: -2,
    TYPE: -1,
    DEFAULT: 0,
    CONDITIONAL: 1,
    BINARY: 2,
    UNARY: 3,
    CALL: 4,
    MEMBER_ACCESS: 5,
    ARRAY_ACCESS: 6,
    UNNAMED: 10,
    INCREMENT: 20,
    NAMED: 50,
}

module.exports = grammar({
    name: "gdshader",

    supertypes: $ => [
        $._expr,
        $._declaration,
        $._statement,
        $._type,
    ],

    extras: $ => [
        /\s|\\\r?\n/,
        $.comment,
    ], 

    conflicts: $ => [
        [$.var_specifier, $.var_declaration],
        [$._type, $._maybe_ident],
        [$._maybe_ident_type, $._maybe_ident]
    ],

    rules: {
        source_file: $ => repeat($._declaration),

        // DECLARATIONS 
        _declaration: $ => choice(
            $.shader_type_declaration,
            $.render_mode_declaration,
            $.const_declaration,
            $.varying_declaration,
            $.group_uniforms_declaration,
            $.uniform_declaration,
            $.struct_declaration,
            $.function_declaration,
            $.include_declaration,
        ),

        shader_type_declaration: $ => prec(PREC.NAMED, seq(
            "shader_type",
            field("shader_type", choice(
                $.shader_type,
                alias($.unmatched_text, $.invalid_shader_type)
            )),
            ";"
        )),

        render_mode_declaration: $ => prec(PREC.NAMED, seq(
            "render_mode",
            field("render_modes", commaSep(choice(
                    $.render_mode,
                    alias($.unmatched_text, $.invalid_render_mode),
            ))),
            ";"
        )),

        const_declaration: $ => prec(PREC.NAMED, seq(
            "const",
            optional($.precision_qualifier),
            field("specifier", $.var_specifier),
            optional(seq("=", field("value", $._expr))),
            ";"
        )),

        varying_declaration: $ => prec(PREC.NAMED, seq(
            "varying",
            optional($.interpolation_qualifier),
            optional($.precision_qualifier),
            field("specifier", $.var_specifier),
            ";"
        )),

        group_uniforms_declaration: $ => prec(PREC.NAMED, seq(
            "group_uniforms",
            optional(field("group_name", $._maybe_ident)),
            optional(seq(".", field("subgroup_name", $._maybe_ident))),
            ";"
        )),
    
        uniform_declaration: $ => prec(PREC.NAMED, seq(
            optional(choice(
                "global",
                "instance"
            )),
            "uniform",
            optional($.precision_qualifier),
            field("specifier", $.var_specifier),
            optional(seq(":", field("hints", $.hint_list))),
            optional(seq("=", field("value", $._expr))),
            ";"
        )),

        hint_list: $ => commaSep1($.hint),

        hint: $ => seq(
            field("name", choice(
                $.hint_name,
                alias($.unmatched_text, $.invalid_hint),
            )),
            optional(seq(
                "(",
                optional(field("params", $.hint_parameter_list)),
                ")"
            ))
        ),

        hint_parameter_list: $ => seq( 
            commaSep1( choice($.integer, $.float) ),
        ),
        
        struct_declaration: $ => prec(PREC.NAMED, seq(
            "struct",
            field("name", $._maybe_ident),
            "{",
            optional(field("members", $.struct_member_list)),
            "}",
            ";"
        )),

        struct_member_list: $ => repeat1(
            $.struct_member
        ),

        struct_member: $ => seq(
            field("type", $._type),
            field("name", $._maybe_ident),
            optional(field("sizes", $.array_sizes)),
            ";"
        ),

        function_declaration: $ => prec(PREC.UNNAMED, seq(
            field("function_type", $._type),
            field("name", $._maybe_ident),
            "(",
            optional(field("parameters", $.parameter_list)), 
            ")",
            $.block,
        )),

        parameter_list: $ => seq(
            commaSep1(seq(
                optional(field(
                    "qualifier",
                    $.param_qualifier
                )),
                alias($.var_specifier, $.parameter),
            )),
        ),

        var_specifier: $ => prec(-100, seq(
            field("type", $._type),
            field("name", $._maybe_ident),
            optional(field("sizes", $.array_sizes))
        )),

        include_declaration: $ => seq(
            "#", "include",
            field("file", $.string)
        ),

        // STATEMENTS
        _statement: $ => choice(
            $.var_declaration,
            $.const_var_declaration,
            $.assignment_statement,
            $.adjustment_statement,
            $.switch_statement,
            $.for_statement,
            $.while_statement,
            $.if_statement,
            $.expr_statement,
            $.continue_statement,
            $.break_statement,
            $.return_statement,
            $.block,
        ),

        var_declaration: $ => prec(PREC.ASSIGNMENT, seq(
            field("specifier", $.var_specifier),
            optional(seq(
                "=",
                field("value", $._expr)
            )),
            ";"
        )),

        const_var_declaration: $ => prec(PREC.NAMED, seq(
            "const",
            optional($.precision_qualifier),
            field("specifier", $.var_specifier),
            optional(seq(
                "=",
                field("value", $._expr)
            )),
            ";"
        )),
    
        assignment_statement: $ => prec(PREC.UNNAMED, seq(
            field("argument", choice(
                $.member_expr,
                $.subscript_expr,
                $._maybe_ident
            )),
            field("operation", choice("=", "+=", "-=")),
            field("value", $._expr),
            ";"
        )),

        adjustment_statement: $ => prec(PREC.INCREMENT, choice(
            seq(
                field("argument", choice(
                    $.member_expr,
                    $.subscript_expr,
                    $._maybe_ident
                )),
                field("operation", choice("++", "--")),
                ";"
            ),
            seq(
                field("operation", choice("++", "--")),
                field("argument", choice(
                    $.member_expr,
                    $.subscript_expr,
                    $._maybe_ident,
                )),
                ";"
            ),
        )),

        switch_statement: $ => prec(PREC.NAMED, seq(
            "switch", "(", field("condition", $._expr), ")",
            "{",
            repeat(field("case", $.switch_case)),
            "}"
        )),

        switch_case: $ => seq(
            seq(
                choice(
                    seq("case", field("argument", $._expr), ":"),
                    seq("default", ":"),
                ),
                optional(field("statements", $.switch_statements))
            )
        ),

        switch_statements: $ => repeat1($._statement),

        for_statement: $ => prec(PREC.NAMED, seq(
            "for",
            field("logic", $._for_statement_logic),
            field("action", $._statement),
        )), 

        _for_statement_logic: $ => seq(
            "(",
            field("initializer", $.var_declaration),
            field("condition", $.expr_statement),
            field("update", $._expr),
            ")"
        ),

        while_statement: $ => prec(PREC.NAMED, seq(
            "while",
            field("condition", $.paren_expr),
            field("action", $._statement),
        )),

        if_statement: $ => prec.right(PREC.NAMED, seq(
            "if",
            field("condition", $.paren_expr),
            field("action", $._statement),
            optional(field("alternate", $._else_statement))
        )),

        _else_statement: $ => prec(PREC.NAMED, seq(
            "else",
            field("action", $._statement),
        )),


        expr_statement: $ => prec(68, seq(
            field("value", $._expr),
            ";",
        )),

        continue_statement: $ => prec(PREC.NAMED, seq(
            "continue", ";"
        )),

        break_statement: $ => prec(PREC.NAMED, seq(
            "break", ";"
        )),

        return_statement: $ => prec(PREC.NAMED, seq(
            "return",
            optional(field("value", $._expr)),
            ";"
        )),

        block: $ => seq(
            "{",
            optional(field("statements", $.statement_sequence)),
            "}"
        ),

        statement_sequence: $ => repeat1(
            $._statement
        ),

        // EXPRESSIONS
        _expr: $ => choice(
            $.primitive_expr,
            $.ident_expr,
            $.unary_expr,
            $.binary_expr,
            $.call_expr,
            $.paren_expr,
            $.conditional_expr,
            $.subscript_expr,
            $.member_expr,
            $.array_literal_expr,
        ),

        primitive_expr: $ => choice(
            $.boolean,
            $.integer,
            $.float
        ),

        ident_expr: $ => $._maybe_ident,

        unary_expr: $ => prec.left(PREC.UNARY, seq(
            choice("!", "~", "-", "+"),
            field("argument", $._expr)
        )),


        binary_expr: $ => prec.left(PREC.BINARY, seq(
            field("left", $._expr),
            choice(
                "==", "!=",
                "||", "&&",
                "|", "^",
                "&", "%",
                "<<", ">>",
                "+", "-",
                "*", "/",
                ">=", "<=",
                ">", "<"
            ),
            field("right", $._expr)
        )), 

        call_expr: $ => prec(PREC.CALL, seq(
            field("function", choice($.builtin_type, $._maybe_ident)),
            "(",
            optional(field("arguments", $.argument_list)),
            ")"
        )),

        argument_list: $ => seq(
            commaSep1(seq(
                optional(field("param_qualifier", $.param_qualifier)),
                $._expr
            )),
        ),

        paren_expr: $ => prec(PREC.PARENTHESIS, seq(
            "(",
            field("value", $._expr),
            ")"
        )),

        conditional_expr: $ => prec.right(PREC.CONDITIONAL,seq(
            field("condition", $._expr),
            "?",
            field("action", $._expr),
            ":",
            field("alternate", $._expr),
        )),

        subscript_expr: $ => prec(PREC.ARRAY_ACCESS,seq(
            field("argument", $._expr),
            "[",
            field("index", $._expr),
            "]"
        )),
        
        member_expr: $ => prec(PREC.MEMBER_ACCESS,seq(
            field("argument", $._expr),
            ".",
            field("member", $._maybe_ident)
        )),
        
        array_literal_expr: $ => prec(PREC.DEFAULT, seq(
            "{",
            field("values", $.array_literal_values),
            "}",
        )),

        array_literal_values: $ => commaSep1($._expr),

        /// OTHER
        comment: $ => token(choice( 
            seq('//', /(\\+(.|\r?\n)|[^\\\n])*/),
            seq(
                '/*',
                /[^*]*\*+([^/*][^*]*\*+)*/,
                '/',
            ),
        )),

        _type: $ => choice(
            $.builtin_type,
            $.array_type,
            $._maybe_ident_type,
        ),

        _maybe_ident_type: $ => choice(
            alias($.hint_name, $.invalid_type),
            alias($.precision_qualifier, $.invalid_type),
            alias($.interpolation_qualifier, $.invalid_type),
            alias($.builtin_variable, $.invalid_type),
            alias($.builtin_function, $.invalid_type),
            alias(/[a-zA-Z_][a-zA-Z0-9_]*/, $.ident_type),
        ),

        array_type: $ => seq(
            field("base_type", $._type),
            "[",
            field("size", $.integer),
            "]",
        ),

        array_sizes: $ => prec.right(PREC.ARRAY_ACCESS, repeat1(seq(
            "[",
            field("size", $.integer),
            "]",
        ))),


        _maybe_ident: $ => choice(
            alias($.hint_name, $.invalid_ident),
            alias($.precision_qualifier, $.invalid_ident),
            alias($.interpolation_qualifier, $.invalid_ident),
            alias($.builtin_type, $.invalid_ident),
            $.builtin_variable,
            $.builtin_function,
            alias(/[a-zA-Z_][a-zA-Z0-9_]*/, $.ident)
        ),

        boolean: $ => choice("true", "false"),

        integer: $ => /\d+/,

        float: $ => /\d+\.\d+/,

        string: $ => /"([^"]*)"/,

        unmatched_text: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,

        precision_qualifier: $ => choice(
            "lowp", "mediump",
            "highp",
        ),

        interpolation_qualifier: $ => choice(
            "smooth", "flat"
        ),

        shader_type: $ => choice(
            "spatial", "canvas_item",
            "particles", "sky",
            "fog"
        ),

        render_mode: $ => choice(
            "blend_add", "blend_sub",
            "blend_mul", "blend_premul_alpha",
            "blend_disabled", "unshaded",
            "light_only", "skip_vertex_transform",
            "world_vertex_coords", "keep_data",
            "disable_force", "disable_velocity",
            "collision_use_scale", "use_half_res_pass",
            "use_quarter_res_pass", "disable_fog",
            "depth_draw_opaque", "depth_draw_always",
            "depth_draw_never", "depth_prepass_alpha",
            "depth_test_disabled", "sss_mode_skin",
            "cull_back", "cull_front",
            "cull_disabled", "wireframe",
            "diffuse_burley", "diffuse_lambert",
            "diffuse_lambert_wrap", "diffuse_toon",
            "specular_schlick_ggx", "specular_toon",
            "specular_disabled", "ensure_correct_normals",
            "shadows_disabled", "ambient_light_disabled",
            "shadow_to_opacity", "vertex_lighting",
            "particle_trails", "alpha_to_coverage",
            "alpha_to_coverage_and_one", "fog_disabled",
        ),

        keyword: $ => choice(
            "render_mode", "shader_type",
            "group_uniforms", "global",
            "instance", "const",
            "varying", "uniform",
            "struct", "for",
            "while", "do",
            "if", "else",
            "elif", "continue",
            "break", "switch",
            "case", "default",
            "#include"
        ),
        param_qualifier: $ => choice(
            "in", "out", "inout"
        ),

        builtin_type: $ => choice(
            "void", "bool",
            "bvec2", "bvec3",
            "bvec4", "int",
            "ivec2", "ivec3",
            "ivec4", "uint",
            "uvec2", "uvec3",
            "uvec4", "float",
            "vec2", "vec3",
            "vec4", "mat2",
            "mat3", "mat4",
            "sampler2D", "isampler2D",
            "usampler2D", "sampler2DArray",
            "isampler2DArray", "usampler2DArray",
            "sampler3D", "isampler3D",
            "usampler3D", "samplerCube",
            "samplerCubeArray",
        ),

        hint_name: $ => choice(
            "source_color", "hint_range",
            "hint_normal", "hint_default_white",
            "hint_default_black", "hint_default_transparent",
            "hint_anisotropy", "hint_roughness_r",
            "hint_roughness_g", "hint_roughness_b",
            "hint_roughness_a", "hint_roughness_normal",
            "hint_roughness_gray", "filter_nearest",
            "filter_linear", "filter_mipmap",
            "filter_anisotropic", "repeat_enable",
            "repeat_disable", "hint_screen_texture",
            "hint_depth_texture", "hint_normal_roughness_texture"
        ),

        builtin_variable: $ => choice(
            "TIME", "PI",
            "TAU", "E",
            "ACTIVE", "ALBEDO",
            "ALPHA", "ALPHA_ANTIALIASING_EDGE",
            "ALPHA_HASH_SCALE", "ALPHA_SCISSOR_THRESHOLD",
            "ALPHA_TEXTURE_COORDINATE",
            "AMOUNT_RATIO", "ANISOTROPY",
            "ANISOTROPY_FLOW", "AO",
            "AO_LIGHT_AFFECT", "ATTENUATION",
            "ATTRACTOR_FORCE", "AT_CUBEMAP_PASS",
            "AT_HALF_RES_PASS", "AT_LIGHT_PASS",
            "AT_QUARTER_RES_PASS", "BACKLIGHT",
            "BINORMAL", "BONE_INDICES",
            "BONE_WEIGHTS", "CAMERA_DIRECTION_WORLD",
            "CAMERA_POSITION_WORLD", "CANVAS_MATRIX",
            "CLEARCOAT", "CLEARCOAT_GLOSS",
            "COLLIDED", "COLLISION_DEPTH",
            "COLLISION_NORMAL", "CUSTOM",
            "DELTA", "DENSITY",
            "DEPTH", "DEPTH_TEXTURE",
            "DIFFUSE_LIGHT", "EMISSION",
            "EMISSION_TRANSFORM", "EMITTER_VELOCITY",
            "EYEDIR", "EYE_OFFSET",
            "FLAG_EMIT_COLOR", "FLAG_EMIT_CUSTOM",
            "FLAG_EMIT_POSITION", "FLAG_EMIT_ROT_SCALE",
            "FLAG_EMIT_VELOCITY", "FOG",
            "FRAGCOORD", "FRONT_FACING",
            "HALF_RES_COLOR", "INDEX",
            "INTERPOLATE_TO_END", "INV_PROJECTION_MATRIX",
            "INV_VIEW_MATRIX", "IRRADIANCE",
            "LIFETIME", "LIGHT",
            "LIGHTX_COLOR", "LIGHTX_DIRECTION",
            "LIGHTX_ENABLED", "LIGHTX_ENERGY",
            "LIGHTX_SIZE", "LIGHT_COLOR",
            "LIGHT_IS_DIRECTIONAL", "LIGHT_VERTEX",
            "MASS", "METALLIC",
            "MODELVIEW_MATRIX", "MODELVIEW_NORMAL_MATRIX",
            "MODEL_MATRIX", "MODEL_NORMAL_MATRIX",
            "NODE_POSITION_VIEW", "NODE_POSITION_WORLD",
            "NORMAL", "NORMAL_MAP",
            "NORMAL_MAP_DEPTH", "NORMAL_TEXTURE",
            "NUMBER", "OBJECT_POSITION",
            "OUTPUT_IS_SRGB", "POINT_COORD",
            "POSITION", "PROJECTION_MATRIX",
            "QUARTER_RES_COLOR", "RADIANCE",
            "RANDOM_SEED", "RESTART",
            "RESTART_COLOR", "RESTART_CUSTOM",
            "RESTART_POSITION", "RESTART_ROT_SCALE",
            "RESTART_VELOCITY", "RIM",
            "RIM_TINT", "ROUGHNESS",
            "SCREEN_MATRIX", "SCREEN_TEXTURE",
            "SCREEN_UV", "SDF",
            "SHADOW_VERTEX", "SIZE",
            "SKY_COORDS", "SPECULAR_AMOUNT",
            "SPECULAR_LIGHT", "SPECULAR_SHININESS",
            "SPECULAR_SHININESS_TEXTURE", "SSS_STRENGTH",
            "SSS_TRANSMITTANCE_BOOST", "SSS_TRANSMITTANCE_COLOR",
            "SSS_TRANSMITTANCE_DEPTH", "TANGENT",
            "TEXTURE_PIXEL_SIZE", "TRANSFORM",
            "USERDATAX", "UV", "UV2",
            "UVW", "VELOCITY",
            "VERTEX", "VIEW",
            "VIEWPORT_SIZE", "VIEW_INDEX",
            "VIEW_MATRIX", "VIEW_MONO_LEFT",
            "VIEW_RIGHT", "WORLD_POSITION"
        ),

        builtin_function: $ => choice(
            "radians", "degrees",
            "sin", "cos",
            "tan", "asin",
            "acos", "atan",
            "sinh", "cosh",
            "tanh", "asinh",
            "acosh", "atanh",
            "pow", "exp",
            "exp2", "log",
            "log2", "sqrt",
            "inversesqrt", "abs",
            "sign", "floor",
            "round", "roundEven",
            "trunc", "ceil",
            "fract", "mod",
            "modf", "min",
            "max", "clamp",
            "mix", "fma",
            "step", "smoothstep",
            "isnan", "isinf",
            "floatBitsToInt", "floatBitsToUint",
            "intBitsToFloat", "uintBitsToFloat",
            "length", "distance",
            "dot", "cross",
            "normalize", "reflect",
            "refract", "faceforward",
            "matrixCompMult", "outerProduct",
            "transpose", "determinant",
            "inverse", "lessThan",
            "greaterThan", "lessThanEqual",
            "greaterThanEqual", "equal",
            "notEqual", "any",
            "all", "not",
            "textureSize", "textureQueryLod",
            "textureQueryLevels", "texture",
            "textureProj", "textureLod",
            "textureProjLod", "textureGrad",
            "textureProjGrad", "texelFetch",
            "textureGather", "dFdx",
            "dFdxCoarse", "dFdxFine",
            "dFdy", "dFdyCoarse",
            "dFdyFine", "fwidth",
            "fwidthCoarse", "fwidthFine",
            "packHalf2x16", "unpackHalf2x16",
            "packUnorm2x16", "unpackUnorm2x16",
            "packSnorm2x16", "unpackSnorm2x16",
            "packUnorm4x8", "unpackUnorm4x8",
            "packSnorm4x8", "unpackSnorm4x8",
            "bitfieldExtract", "bitfieldInsert",
            "bitfieldReverse", "bitCount",
            "findLSB", "findMSB",
            "imulExtended", "umulExtended",
            "uaddCarry", "usubBorrow",
            "ldexp", "frexp",
            "emit_subparticle",
        ),
    }
})

function commaSep(rule) {
  return optional(commaSep1(rule));
}

function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)));
}
