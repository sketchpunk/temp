
class ProtoFactory{

	static append_sphere_chain( arm, config, name_ary, do_shift=false, scl=1 ){
		let b, n, radius,
			opt		= [0,0,1],
			zero	= [0,0,0],
			one		= [1,1,1],
			rot		= [0,0,0,1];

		for( n of name_ary ){
			b		= arm.get_bone( n );
			radius	= b.len / 2 * scl;

			config.push({
				bone		: b.name,
				base_opt	: opt,
				scl_top 	: [ radius, radius, radius ],
				scl_bot 	: [ radius, radius, radius ],
				scl_mid		: one,
				pos_top		: zero,
				pos_mid 	: zero,
				pos_bot		: zero,
				base_pos	: ( !do_shift )? zero : [0,radius,0],
				base_rot	: rot,
			});
		}

		return this;
	}

	static append_capsule_chain( arm, config, name_ary, cap_scl=0.03, offset=0 ){
		let b, n, mid, cap_y,
			cap 	= [ cap_scl, cap_scl, cap_scl ],
			opt		= [0,0,1],
			zero	= [0,0,0],
			one		= [1,1,1],
			rot		= [0,0,0,1];

		for( n of name_ary ){
			b		= arm.get_bone( n );
			mid		= b.len / 2;
			cap_y	= mid - cap_scl + offset;

			config.push({
				bone		: b.name,
				base_opt	: opt,
				scl_top 	: cap,
				scl_mid		: one,
				scl_bot 	: cap,
				pos_top		: [ 0, cap_y, 0 ],
				pos_mid 	: zero,
				pos_bot		: [ 0, cap_y, 0 ],
				base_pos	: [ 0, mid, 0 ],
				base_rot	: rot,
			});
		}

		return this;
	}

	static append_cap_chain( arm, config, name_ary, scl_out=0.09, scl_in=0.08, scl_cap=0.03, offset=0, do_shift=false ){
		let b, n, mid, cap_y,
			opt		= [1,0,1],
			zero	= [0,0,0],
			scl_o	= [scl_out,scl_cap,scl_out],
			scl_i	= [scl_in,0,scl_in],
			rot		= [0,0,0,1];

		for( n of name_ary ){
			b		= arm.get_bone( n );
			mid		= b.len / 2;
			cap_y	= mid - scl_cap + offset;

			config.push({
				bone		: b.name,
				base_opt	: opt,
				scl_top 	: scl_o,
				scl_mid		: scl_i,
				scl_bot 	: scl_o,
				pos_top		: [ 0, cap_y, 0],
				pos_mid 	: zero,
				pos_bot		: [0, -cap_y, 0],
				base_pos	: ( !do_shift )? zero:[ 0, mid, 0 ],
				base_rot	: rot,
			});
		}

		return this;
	}
}

export default ProtoFactory;