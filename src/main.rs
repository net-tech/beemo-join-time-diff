use std::env;
use std::time::Instant;

use anyhow::{Context, Result};
use chrono::{DateTime, Duration as ChronoDuration, Utc};
use humantime::format_duration;
use regex::Regex;

fn main() -> Result<()> {
    let log_domains = ["logs.beemo.gg", "archive.ayu.dev"];
    let log_date_re =
        Regex::new(r"\d\d\d\d/\d\d/\d\d(?m)").with_context(|| "Error compiling regex")?;
    let join_date_re = Regex::new(r"\d\d:\d\d:\d\d\.\d\d\d[+,-]\d\d\d\d(?mi)")
        .with_context(|| "Error compiling regex")?;

    let args: Vec<String> = env::args().collect();

    if args.len() < 2 {
        eprintln!("Please provide a Beemo log link directly when running the command.");
        std::process::exit(1);
    }

    let url = &args
        .get(1)
        .with_context(|| "Please provide a Beemo log link directly when running the command.")?;

    if !log_domains.iter().any(|&domain| url.contains(domain)) {
        eprintln!("Invalid log URL. Beemo logs use the logs.beemo.gg or archive.ayu.dev domains.");
        std::process::exit(1);
    }

    let mut parsed_join_dates: Vec<DateTime<Utc>> = vec![];
    let mut join_difference: Vec<ChronoDuration> = vec![];
    let mut zero_difference_indexes: Vec<i64> = vec![];

    println!("Fetching log...");

    let text = reqwest::blocking::get(*url)
        .with_context(|| format!("Could not read text from URL `{}`", url))?
        .text()
        .with_context(|| format!("Could not read text from URL `{}`", url))?;

    println!("Analysis in progress...");

    let start_time = Instant::now();

    let log_date = log_date_re
        .find(&text)
        .map(|m| m.as_str())
        .unwrap_or("1970/01/01");

    let matches: Vec<&str> = join_date_re.find_iter(&text).map(|m| m.as_str()).collect();

    if log_date.is_empty() || matches.is_empty() {
        eprintln!("No join dates found in log.");
        std::process::exit(1);
    };

    for (idx, join_date) in matches.iter().enumerate() {
        // Add the date to add a valid DateTime.
        let mut date: DateTime<Utc> = DateTime::parse_from_str(
            &format!("{}T{}", log_date, join_date),
            "%Y/%m/%dT%H:%M:%S%.3f%z",
        )
        .with_context(|| format!("Could not parse date `{}T{}`", log_date, join_date))?
            // Convert to UTC.
        .try_into()
        .with_context(|| format!("Could not parse date `{}T{}`", log_date, join_date))?;

        // We always want the time to be in UTC. Older Beemo logs had a timezone offset; https://stackoverflow.com/a/44710935/12586914.
        if join_date.ends_with("-0700") {
            date = date + ChronoDuration::hours(7);
        }

        parsed_join_dates.push(date);

        if idx == 0 {
            continue;
        }
        let difference = ChronoDuration::milliseconds(
            date.timestamp_millis()
                - parsed_join_dates
                    .get(idx - 1)
                    .unwrap_or(&Utc::now())
                    .timestamp_millis(),
        );

        if difference.num_milliseconds() < 0 {
            continue;
        }

        join_difference.push(difference);

        if difference.num_milliseconds() == 0 {
            zero_difference_indexes.push(
                idx.try_into()
                    .with_context(|| "Unable to convert index to usize")?,
            );
        };
    }

    let average_join_difference = join_difference.iter().sum::<ChronoDuration>()
        / join_difference
            .len()
            .try_into()
            .with_context(|| "Unable to convert length to usize")?;
    let human_average_join_difference = format_duration(
        average_join_difference
            .to_std()
            .with_context(|| "Error converting ChronoDuration to Std Duration")?,
    );

    let zero_diff_occurrence = zero_difference_indexes.len() as f64 / matches.len() as f64 * 100.0;

    let end_time = Instant::now();
    println!(
        "Analysis completed in {} milliseconds.",
        end_time.duration_since(start_time).as_millis()
    );

    println!("Analyzed {} joins. Average time between each join is {}. There were {} occurrences of two joins happening at the same time (0 ms apart). This accounts for {:.2}% of all joins.", matches.len(), human_average_join_difference, zero_difference_indexes.len(), zero_diff_occurrence);
    Ok(())
}
