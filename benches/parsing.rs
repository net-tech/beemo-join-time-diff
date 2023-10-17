use codspeed_criterion_compat::{black_box, criterion_group, criterion_main, Criterion};
use beemo_join_time_diff::parse_join_dates;

pub fn parse_join_dates_benchmark(c: &mut Criterion) {
    // 13,518 accounts: https://logs.beemo.gg/antispam/xKbSJMc7n5X1
    let text = include_str!("log_data.txt");

    c.bench_function("parse_join_dates", |b| {
        b.iter(|| parse_join_dates(black_box(&text)))
    });
}

criterion_group!(benches, parse_join_dates_benchmark);
criterion_main!(benches);
